import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateICSFile } from '@/lib/booking/email';
import { getSettings } from '@/lib/booking/settings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookingId = searchParams.get('id');

  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    
    // Fetch the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only allow ICS download for confirmed bookings
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Booking is not confirmed' }, { status: 400 });
    }

    // Get settings for ICS generation
    const settings = await getSettings(true);
    
    // Generate ICS file content
    const icsContent = generateICSFile(booking, settings);

    // Return as downloadable file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="mbr-booking-${bookingId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating ICS file:', error);
    return NextResponse.json({ error: 'Failed to generate calendar file' }, { status: 500 });
  }
}

