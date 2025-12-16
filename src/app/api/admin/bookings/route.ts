import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (email ends with @mbrme.com)
    if (!session.user.email.endsWith('@mbrme.com')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS and read all bookings
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let query = supabase
      .from('bookings')
      .select('*')
      .order('slot_start', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('slot_start', startOfDay.toISOString())
        .lte('slot_start', endOfDay.toISOString());
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Failed to fetch bookings:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    console.log(`Fetched ${bookings?.length || 0} bookings for admin:`, session.user.email);
    if (bookings && bookings.length > 0) {
      console.log('Booking statuses:', bookings.map(b => b.status).join(', '));
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
    });
  } catch (error) {
    console.error('Admin bookings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

