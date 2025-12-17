import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validateConfirmationToken } from '@/lib/booking/tokens';
import { sendConfirmedEmail } from '@/lib/booking/email';
import { createCalendarEvent } from '@/lib/booking/calendar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Confirmation token is required' },
        { status: 400 }
      );
    }
    
    // Validate token
    const tokenValidation = await validateConfirmationToken(token);
    
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { 
          error: tokenValidation.expired 
            ? 'Confirmation link has expired. Please create a new booking.' 
            : 'Invalid confirmation token.',
          expired: tokenValidation.expired,
        },
        { status: 400 }
      );
    }
    
    const bookingId = tokenValidation.bookingId!;
    
    // Use admin client to read booking (bypasses RLS)
    const supabase = createAdminClient();
    
    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Check if already confirmed
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        message: 'Booking is already confirmed',
        booking: {
          id: booking.id,
          status: booking.status,
        },
      });
    }
    
    // Update booking status
    let googleEventId: string | undefined;
    let googleCalendarLink: string | undefined;
    
    // Create Google Calendar event (optional - won't fail booking if it fails)
    console.log('Creating Google Calendar event for booking:', bookingId);
    try {
      const calendarEvent = await createCalendarEvent(booking);
      if (calendarEvent) {
        googleEventId = calendarEvent.eventId;
        googleCalendarLink = calendarEvent.htmlLink;
        console.log('Google Calendar event created successfully:', {
          eventId: googleEventId,
          calendarLink: googleCalendarLink,
        });
      } else {
        console.warn('Calendar event not created - check Google Calendar settings');
      }
    } catch (calendarError) {
      console.error('Failed to create calendar event:', calendarError);
      // Continue with confirmation even if calendar fails
    }
    
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'CONFIRMED',
        confirmed_at: new Date().toISOString(),
        google_event_id: googleEventId || null,
      })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('Booking update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm booking' },
        { status: 500 }
      );
    }
    
    // Send confirmation email with ICS attachment
    try {
      await sendConfirmedEmail(booking);
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Don't fail if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: {
        id: booking.id,
        status: 'CONFIRMED',
      },
    });
    
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

