import { NextResponse } from 'next/server';
import { getServiceTypes } from '@/lib/booking/settings';

export async function GET() {
  try {
    const serviceTypes = await getServiceTypes();
    
    return NextResponse.json({
      success: true,
      service_types: serviceTypes,
    });
  } catch (error) {
    console.error('Failed to fetch service types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service types' },
      { status: 500 }
    );
  }
}

