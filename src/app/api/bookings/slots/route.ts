import { NextResponse } from 'next/server';
import { generateAvailableSlots } from '@/lib/booking/slots';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const serviceType = searchParams.get('service_type');
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start and end dates are required' },
        { status: 400 }
      );
    }
    
    const slots = await generateAvailableSlots(
      new Date(startDate),
      new Date(endDate),
      serviceType || undefined
    );
    
    return NextResponse.json({
      success: true,
      slots,
    });
    
  } catch (error) {
    console.error('Slot generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate available slots' },
      { status: 500 }
    );
  }
}

