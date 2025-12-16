import { google } from 'googleapis';
import { DateTime } from 'luxon';
import { getSettings } from './settings';
import type { Booking } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let calendarClient: any = null;

async function getCalendarClient() {
  if (calendarClient) {
    return calendarClient;
  }
  
  // Use service account credentials
  const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!credentialsStr) {
    throw new Error('Google Service Account credentials not configured in environment variables');
  }
  
  let credentials;
  try {
    credentials = JSON.parse(credentialsStr);
  } catch (error) {
    throw new Error('Invalid Google Service Account credentials JSON format');
  }
  
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Google Service Account credentials missing client_email or private_key');
  }
  
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  
  calendarClient = google.calendar({ version: 'v3', auth });
  
  return calendarClient;
}

/**
 * Get the email address associated with a calendar
 * This is useful for sending calendar invites when direct write access is restricted
 */
async function getCalendarEmail(
  calendar: ReturnType<typeof google.calendar>,
  calendarId: string
): Promise<string | null> {
  try {
    const calendarInfo = await calendar.calendars.get({
      calendarId: calendarId,
    });
    
    // Check if calendar has an email address
    if (calendarInfo.data.id && calendarInfo.data.id.includes('@')) {
      return calendarInfo.data.id;
    }
    
    // For group calendars, the ID itself might be the email
    if (calendarId.includes('@group.calendar.google.com')) {
      return calendarId;
    }
    
    // Try to get from calendar list entry
    const calendarList = await calendar.calendarList.get({
      calendarId: calendarId,
    });
    
    if (calendarList.data.id && calendarList.data.id.includes('@')) {
      return calendarList.data.id;
    }
    
    return null;
  } catch (error) {
    console.warn('Could not get calendar email address:', error);
    return null;
  }
}

export async function createCalendarEvent(booking: Booking): Promise<{
  eventId: string;
  htmlLink: string;
} | null> {
  // Use admin client to read settings (bypasses RLS)
  const settings = await getSettings(true);
  
  try {
    const calendar = await getCalendarClient();
  
    const start = DateTime.fromISO(booking.slot_start).setZone(settings.timezone);
    const end = DateTime.fromISO(booking.slot_end).setZone(settings.timezone);
    
    // Determine which calendar to use
    // If google_calendar_id is set and accessible, use it
    // Otherwise, use the service account's primary calendar
    let targetCalendarId = settings.google_calendar_id;
    let useInviteOnly = false;
    
    // If no calendar ID configured, use service account's primary calendar
    if (!targetCalendarId || targetCalendarId.trim() === '') {
      // Get service account email from credentials
      const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
      if (credentialsStr) {
        try {
          const credentials = JSON.parse(credentialsStr);
          targetCalendarId = credentials.client_email; // Use service account's primary calendar
          useInviteOnly = true;
          console.log('No calendar ID configured, using service account primary calendar:', targetCalendarId);
        } catch {
          // Fallback to 'primary' if we can't parse credentials
          targetCalendarId = 'primary';
          useInviteOnly = true;
        }
      } else {
        targetCalendarId = 'primary';
        useInviteOnly = true;
      }
    }
  
    const event: {
      summary: string;
      description: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      location: string;
      status: string;
      attendees?: Array<{ email: string; responseStatus?: string }>;
    } = {
      summary: `MBR Booking – ${booking.service_type}`,
      description: `Booking ID: ${booking.id}\nCustomer: ${booking.customer_name}\nPhone: ${booking.customer_phone}\nEmail: ${booking.customer_email}${booking.customer_notes ? `\nNotes: ${booking.customer_notes}` : ''}`,
      start: {
        dateTime: start.toISO(),
        timeZone: settings.timezone,
      },
      end: {
        dateTime: end.toISO(),
        timeZone: settings.timezone,
      },
      location: settings.business_address,
      status: 'confirmed',
    };
  
    // Always add business email and customer email as attendees
    // This ensures both receive calendar invites
    const attendees: Array<{ email: string; responseStatus?: string }> = [
      {
        email: 'info@mbrme.com',
        responseStatus: 'accepted',
      },
      {
        email: booking.customer_email,
      },
    ];
    
    // If using a shared calendar, also add it as attendee
    if (settings.google_calendar_id && !useInviteOnly) {
      const calendarEmail = await getCalendarEmail(calendar, settings.google_calendar_id);
      if (calendarEmail && !attendees.some(a => a.email === calendarEmail)) {
        attendees.push({
          email: calendarEmail,
          responseStatus: 'accepted',
        });
      }
    }
    
    event.attendees = attendees;
    console.log('Creating calendar event with attendees:', attendees.map(a => a.email).join(', '));
  
    // Check for conflicts if enabled and we have a calendar ID
    if (settings.google_calendar_conflict_check && settings.google_calendar_id && !useInviteOnly) {
      try {
        const freebusy = await calendar.freebusy.query({
          requestBody: {
            timeMin: start.toISO(),
            timeMax: end.toISO(),
            items: [{ id: settings.google_calendar_id }],
          },
        });
        
        const busy = freebusy.data.calendars?.[settings.google_calendar_id]?.busy || [];
        if (busy.length > 0) {
          throw new Error('Time slot conflicts with existing calendar event');
        }
      } catch (conflictError: unknown) {
        // If conflict check fails, log but don't block booking
        const errorMessage = conflictError instanceof Error ? conflictError.message : String(conflictError);
        console.warn('Conflict check failed, proceeding with booking:', errorMessage);
      }
    }
  
    // Create event in target calendar and send invites to all attendees
    const response = await calendar.events.insert({
      calendarId: targetCalendarId,
      requestBody: event,
      sendUpdates: 'all', // Send calendar invites to all attendees
    });
    
    if (!response.data.id || !response.data.htmlLink) {
      throw new Error('Failed to create calendar event - missing event ID or link');
    }
    
    return {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    };
  } catch (error: unknown) {
    // Log error but don't fail the booking
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to create Google Calendar event:', errorMessage);
    
    // Provide helpful error message for common issues
    const errorCode = (error as { code?: number })?.code;
    if (errorMessage.includes('not found') || errorCode === 404) {
      console.error('Calendar not found. Make sure:');
      console.error('1. The calendar ID is correct in settings');
      console.error('2. The service account has been shared with the calendar');
      console.error('3. The service account email is: website-booking-system@gen-lang-client-0151249415.iam.gserviceaccount.com');
    } else if (errorMessage.includes('permission') || errorCode === 403) {
      console.error('Permission denied. Make sure the service account has "Make changes to events" permission on the calendar.');
    }
    
    // Return null to indicate calendar event was not created, but booking can still proceed
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  // Use admin client to read settings (bypasses RLS)
  const settings = await getSettings(true);
  const calendar = await getCalendarClient();
  
  if (!settings.google_calendar_id) {
    throw new Error('Google Calendar ID not configured');
  }
  
  if (!calendar) {
    throw new Error('Calendar client not initialized');
  }
  
  await calendar.events.delete({
    calendarId: settings.google_calendar_id,
    eventId,
  });
}

