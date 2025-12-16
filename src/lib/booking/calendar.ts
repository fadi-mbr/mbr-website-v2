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
    
    // Validate dates
    if (!start.isValid || !end.isValid) {
      throw new Error(`Invalid date/time: start=${start.invalidReason}, end=${end.invalidReason}`);
    }
    
    const startISO = start.toISO();
    const endISO = end.toISO();
    
    if (!startISO || !endISO) {
      throw new Error('Failed to convert date/time to ISO format');
    }
    
    // Always use service account's primary calendar for event creation
    // Then send invites to attendees (business, customer, and shared calendar if configured)
    // This avoids permission issues with shared calendars
    let targetCalendarId: string;
    
    // Get service account email from credentials to use as calendar ID
    const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    if (credentialsStr) {
      try {
        const credentials = JSON.parse(credentialsStr);
        targetCalendarId = credentials.client_email; // Use service account's primary calendar
        console.log('Using service account primary calendar:', targetCalendarId);
      } catch {
        // Fallback to 'primary' if we can't parse credentials
        targetCalendarId = 'primary';
        console.log('Using "primary" calendar (fallback)');
      }
    } else {
      targetCalendarId = 'primary';
      console.log('Using "primary" calendar (no credentials found)');
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
        dateTime: startISO,
        timeZone: settings.timezone,
      },
      end: {
        dateTime: endISO,
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
    
    // If a shared calendar is configured, also add it as attendee
    // This way the event appears in the shared calendar via invite
    if (settings.google_calendar_id && settings.google_calendar_id.trim() !== '') {
      const calendarEmail = await getCalendarEmail(calendar, settings.google_calendar_id);
      if (calendarEmail && !attendees.some(a => a.email === calendarEmail)) {
        attendees.push({
          email: calendarEmail,
          responseStatus: 'accepted',
        });
        console.log('Adding shared calendar as attendee:', calendarEmail);
      } else if (settings.google_calendar_id.includes('@')) {
        // If calendar ID itself looks like an email, use it directly
        if (!attendees.some(a => a.email === settings.google_calendar_id)) {
          attendees.push({
            email: settings.google_calendar_id,
            responseStatus: 'accepted',
          });
          console.log('Adding shared calendar ID as attendee:', settings.google_calendar_id);
        }
      }
    }
    
    event.attendees = attendees;
    console.log('Creating calendar event in service account calendar with attendees:', attendees.map(a => a.email).join(', '));
  
    // Check for conflicts if enabled (check the shared calendar if configured)
    if (settings.google_calendar_conflict_check && settings.google_calendar_id && settings.google_calendar_id.trim() !== '') {
      try {
        const freebusy = await calendar.freebusy.query({
          requestBody: {
            timeMin: startISO,
            timeMax: endISO,
            items: [{ id: settings.google_calendar_id }],
          },
        });
        
        const busy = freebusy.data.calendars?.[settings.google_calendar_id]?.busy || [];
        if (busy.length > 0) {
          console.warn('Time slot conflicts with existing calendar event in shared calendar');
          // Don't throw - just warn, as we're creating in service account calendar anyway
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

