/**
 * Google Calendar Integration Test Script
 * 
 * Tests Google Calendar API connection and event creation
 * 
 * Usage: npx tsx scripts/test-google-calendar.ts
 */

import { google } from 'googleapis';
import { config } from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/server';
import { DateTime } from 'luxon';

// Load environment variables
config({ path: '.env.local' });

interface CalendarConfig {
  calendarId: string;
  serviceAccountEmail: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

async function getCalendarConfig(): Promise<CalendarConfig> {
  const supabase = createAdminClient();
  
  // Get Google Calendar ID from settings
  const { data: settingsData, error: settingsError } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['google_calendar_id']);
  
  if (settingsError) {
    throw new Error(`Failed to fetch calendar settings: ${settingsError.message}`);
  }
  
  const settingsMap = new Map(settingsData.map(s => [s.key, s.value]));
  
  // Helper to extract string value from JSONB
  const getStringValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') {
      // Remove quotes if present
      return value.replace(/^"|"$/g, '');
    }
    return String(value);
  };
  
  const calendarId = getStringValue(settingsMap.get('google_calendar_id'));
  
  // Get service account credentials
  const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!credentialsStr) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is not set');
  }
  
  let credentials;
  try {
    credentials = JSON.parse(credentialsStr);
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_CREDENTIALS JSON format');
  }
  
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Service account credentials missing client_email or private_key');
  }
  
  return {
    calendarId,
    serviceAccountEmail: credentials.client_email,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, '\n'),
    },
  };
}

async function testCalendarConnection(config: CalendarConfig): Promise<boolean> {
  console.log('\n📅 Testing Google Calendar Connection...\n');
  console.log('Configuration:');
  console.log(`  Calendar ID: ${config.calendarId || '(not set)'}`);
  console.log(`  Service Account Email: ${config.serviceAccountEmail}`);
  console.log(`  Has Credentials: ${!!config.credentials.client_email && !!config.credentials.private_key}`);
  console.log('');
  
  if (!config.calendarId || config.calendarId.trim() === '') {
    console.error('❌ Google Calendar ID is not configured!');
    console.error('\nTo fix this:');
    console.error('1. Go to Admin Dashboard → Settings → Google Calendar');
    console.error('2. Add your Google Calendar ID');
    console.error('3. The calendar ID is usually your email address or found in Google Calendar settings');
    console.error('   Format: your-email@gmail.com or calendar-id@group.calendar.google.com');
    return false;
  }
  
  // Create auth client
  const auth = new google.auth.JWT({
    email: config.credentials.client_email,
    key: config.credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  
  const calendar = google.calendar({ version: 'v3', auth });
  
  // Test 1: Get calendar info
  try {
    console.log('🔍 Test 1: Getting calendar information...');
    const calendarInfo = await calendar.calendars.get({
      calendarId: config.calendarId,
    });
    
    console.log('✅ Calendar found!');
    console.log(`   Name: ${calendarInfo.data.summary || 'N/A'}`);
    console.log(`   Timezone: ${calendarInfo.data.timeZone || 'N/A'}`);
    console.log(`   Description: ${calendarInfo.data.description || 'N/A'}`);
    console.log('');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to get calendar information:');
    console.error(`   Error: ${errorMessage}`);
    
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      console.error('\n   → Calendar not found. Make sure:');
      console.error('     1. The calendar ID is correct');
      console.error('     2. The service account has been shared with the calendar');
      console.error(`     3. Share the calendar with: ${config.serviceAccountEmail}`);
      console.error('     4. Give "Make changes to events" permission');
    } else if (errorMessage.includes('403') || errorMessage.includes('permission')) {
      console.error('\n   → Permission denied. Make sure:');
      console.error(`     1. The calendar is shared with: ${config.serviceAccountEmail}`);
      console.error('     2. The service account has "Make changes to events" permission');
    }
    
    return false;
  }
  
  // Test 2: Create a test event
  try {
    console.log('🔍 Test 2: Creating a test event...');
    
    const now = DateTime.now().setZone('Asia/Dubai');
    const startTime = now.plus({ minutes: 5 });
    const endTime = startTime.plus({ minutes: 30 });
    
    const testEvent = {
      summary: 'MBR Booking System - Test Event',
      description: 'This is a test event created by the MBR Booking System. You can delete this.',
      start: {
        dateTime: startTime.toISO(),
        timeZone: 'Asia/Dubai',
      },
      end: {
        dateTime: endTime.toISO(),
        timeZone: 'Asia/Dubai',
      },
      location: 'Test Location',
      status: 'confirmed',
    };
    
    const eventResult = await calendar.events.insert({
      calendarId: config.calendarId,
      requestBody: testEvent,
    });
    
    if (eventResult.data.id && eventResult.data.htmlLink) {
      console.log('✅ Test event created successfully!');
      console.log(`   Event ID: ${eventResult.data.id}`);
      console.log(`   Event Link: ${eventResult.data.htmlLink}`);
      console.log(`   Start: ${startTime.toFormat('yyyy-MM-dd HH:mm')}`);
      console.log(`   End: ${endTime.toFormat('yyyy-MM-dd HH:mm')}`);
      console.log('');
      console.log('📝 Note: Please delete this test event from your calendar.');
      
      // Optionally delete the test event
      console.log('\n🗑️  Deleting test event...');
      await calendar.events.delete({
        calendarId: config.calendarId,
        eventId: eventResult.data.id,
      });
      console.log('✅ Test event deleted successfully');
    } else {
      console.error('❌ Event created but missing ID or link');
      return false;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to create test event:');
    console.error(`   Error: ${errorMessage}`);
    
    if (errorMessage.includes('403') || errorMessage.includes('permission')) {
      console.error('\n   → Permission denied. Make sure:');
      console.error(`     1. The calendar is shared with: ${config.serviceAccountEmail}`);
      console.error('     2. The service account has "Make changes to events" permission');
      console.error('     3. Check Google Calendar settings → Share with specific people');
    }
    
    return false;
  }
  
  return true;
}

async function main() {
  console.log('🧪 MBR Booking System - Google Calendar Test\n');
  console.log('=' .repeat(50));
  
  try {
    // Get configuration
    const config = await getCalendarConfig();
    
    // Test connection
    const success = await testCalendarConnection(config);
    
    console.log('=' .repeat(50));
    if (success) {
      console.log('✅ All tests passed! Google Calendar integration is working correctly.\n');
    } else {
      console.log('❌ Tests failed. Please fix the issues above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

main();

