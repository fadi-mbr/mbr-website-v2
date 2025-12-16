import { DateTime } from 'luxon';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from './settings';
import type { SlotAvailability } from './types';

export async function generateAvailableSlots(
  startDate: Date,
  endDate: Date,
  serviceTypeId?: string
): Promise<SlotAvailability[]> {
  // Use admin client to read settings (bypasses RLS)
  const settings = await getSettings(true);
  const supabase = await createClient();
  
  const timezone = settings.timezone;
  const slotDuration = settings.slot_duration_minutes;
  const leadTimeHours = settings.lead_time_hours;
  const maxFutureDays = settings.max_future_days;
  const workingHours = settings.working_hours;
  
  // Validate working hours
  if (!workingHours || Object.keys(workingHours).length === 0) {
    console.error('ERROR: Working hours are empty or not configured!');
    console.error('Settings object:', JSON.stringify(settings, null, 2));
    return [];
  }
  
  // Debug logging
  console.log('Slot generation settings:', {
    timezone,
    slotDuration,
    leadTimeHours,
    maxFutureDays,
    workingHoursKeys: Object.keys(workingHours),
    workingHours,
    enabledDays: Object.entries(workingHours)
      .filter(([_, hours]) => hours?.enabled)
      .map(([day]) => day),
  });
  
  // Get service-specific capacity if provided
  const serviceTypes = settings.service_types;
  const serviceType = serviceTypeId 
    ? serviceTypes.find(st => st.id === serviceTypeId)
    : null;
  const slotCapacity = serviceType?.capacity || settings.slot_capacity;
  const serviceDuration = serviceType?.duration_minutes || settings.slot_duration_minutes;
  
  // Calculate lead time cutoff
  const now = DateTime.now().setZone(timezone);
  const leadTimeCutoff = now.plus({ hours: leadTimeHours });
  const maxFutureDate = now.plus({ days: maxFutureDays });
  
  // Get blocked slots
  const { data: blockedSlots } = await supabase
    .from('blocked_slots')
    .select('slot_start, slot_end')
    .gte('slot_start', startDate.toISOString())
    .lte('slot_end', endDate.toISOString());
  
  const blockedRanges = (blockedSlots || []).map(bs => ({
    start: DateTime.fromISO(bs.slot_start).setZone(timezone),
    end: DateTime.fromISO(bs.slot_end).setZone(timezone),
  }));
  
  // Get existing bookings for capacity calculation
  const { data: bookings } = await supabase
    .from('bookings')
    .select('slot_start, slot_end, status')
    .gte('slot_start', startDate.toISOString())
    .lte('slot_end', endDate.toISOString())
    .in('status', ['PENDING', 'CONFIRMED']);
  
  // Group bookings by slot
  const bookingsBySlot = new Map<string, number>();
  (bookings || []).forEach(booking => {
    const slotKey = `${booking.slot_start}_${booking.slot_end}`;
    bookingsBySlot.set(slotKey, (bookingsBySlot.get(slotKey) || 0) + 1);
  });
  
  // Generate slots
  const slots: SlotAvailability[] = [];
  let current = DateTime.fromJSDate(startDate).setZone(timezone);
  const end = DateTime.fromJSDate(endDate).setZone(timezone);
  
  console.log('Generating slots from', current.toISO(), 'to', end.toISO());
  console.log('Lead time cutoff:', leadTimeCutoff.toISO());
  console.log('Max future date:', maxFutureDate.toISO());
  
  let daysProcessed = 0;
  let slotsGenerated = 0;
  
  while (current < end) {
    daysProcessed++;
    const dayOfWeek = current.toFormat('EEEE').toLowerCase();
    const dayHours = workingHours[dayOfWeek];
    
    // Skip if day is disabled
    if (!dayHours?.enabled) {
      console.log(`Skipping ${dayOfWeek} (${current.toFormat('yyyy-MM-dd')}) - disabled`);
      current = current.plus({ days: 1 }).startOf('day');
      continue;
    }
    
    if (!dayHours) {
      console.log(`Skipping ${dayOfWeek} (${current.toFormat('yyyy-MM-dd')}) - no working hours configured`);
      current = current.plus({ days: 1 }).startOf('day');
      continue;
    }
    
    // Parse working hours
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
    
    if (isNaN(openHour) || isNaN(openMinute) || isNaN(closeHour) || isNaN(closeMinute)) {
      console.error(`Invalid working hours for ${dayOfWeek}:`, dayHours);
      current = current.plus({ days: 1 }).startOf('day');
      continue;
    }
    
    const dayStart = current.startOf('day').plus({ hours: openHour, minutes: openMinute });
    const dayEnd = current.startOf('day').plus({ hours: closeHour, minutes: closeMinute });
    
    console.log(`Processing ${dayOfWeek} (${current.toFormat('yyyy-MM-dd')}): ${dayStart.toFormat('HH:mm')} - ${dayEnd.toFormat('HH:mm')}`);
    
    // Generate slots for this day
    let slotStart = DateTime.max(current, dayStart);
    let daySlotsCount = 0;
    
    while (slotStart < dayEnd) {
      const slotEnd = slotStart.plus({ minutes: serviceDuration });
      
      // Skip if slot end exceeds day end
      if (slotEnd > dayEnd) {
        break;
      }
      
      // Skip if before lead time
      if (slotStart < leadTimeCutoff) {
        slotStart = slotStart.plus({ minutes: slotDuration });
        continue;
      }
      
      // Skip if beyond max future date
      if (slotStart > maxFutureDate) {
        console.log(`Stopping slot generation - reached max future date: ${slotStart.toISO()}`);
        break;
      }
      
      // Check if blocked
      const isBlocked = blockedRanges.some(blocked => 
        slotStart < blocked.end && slotEnd > blocked.start
      );
      
      if (!isBlocked) {
        const slotKey = `${slotStart.toISO()}_${slotEnd.toISO()}`;
        const booked = bookingsBySlot.get(slotKey) || 0;
        const available = booked < slotCapacity;
        
        let status: 'available' | 'limited' | 'full';
        if (booked === 0) {
          status = 'available';
        } else if (booked < slotCapacity) {
          status = 'limited';
        } else {
          status = 'full';
        }
        
        slots.push({
          slot_start: slotStart.toISO()!,
          slot_end: slotEnd.toISO()!,
          available,
          capacity: slotCapacity,
          booked,
          status,
        });
        daySlotsCount++;
        slotsGenerated++;
      }
      
      slotStart = slotStart.plus({ minutes: slotDuration });
    }
    
    if (daySlotsCount > 0) {
      console.log(`  Generated ${daySlotsCount} slots for ${dayOfWeek}`);
    }
    
    // Move to next day
    current = current.plus({ days: 1 }).startOf('day');
  }
  
  console.log(`Total: Processed ${daysProcessed} days, generated ${slotsGenerated} slots`);
  
  console.log(`Generated ${slots.length} available slots`);
  return slots;
}

export function isSlotAvailable(
  slotStart: string,
  slotEnd: string,
  slots: SlotAvailability[]
): boolean {
  const slot = slots.find(s => 
    s.slot_start === slotStart && s.slot_end === slotEnd
  );
  return slot?.available ?? false;
}

