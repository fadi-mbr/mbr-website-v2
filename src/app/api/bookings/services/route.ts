import { NextResponse } from 'next/server';
import type { ServiceType } from '@/lib/booking/types';

// Hardcoded service types for MBR Auto Services
export const DEFAULT_SERVICE_TYPES: ServiceType[] = [
  {
    id: 'inspection',
    name: 'Vehicle Inspection & Diagnosis',
    duration_minutes: 30,
    capacity: 1,
    admin_notes: '',
  },
  {
    id: 'mechanical',
    name: 'Mechanical Repair',
    duration_minutes: 60,
    capacity: 1,
    admin_notes: '',
  },
  {
    id: 'electrical',
    name: 'Electrical & Battery Repair',
    duration_minutes: 60,
    capacity: 1,
    admin_notes: '',
  },
  {
    id: 'body_paint',
    name: 'Body & Paint Repair',
    duration_minutes: 60,
    capacity: 1,
    admin_notes: '',
  },
  {
    id: 'ac_cooling',
    name: 'AC & Cooling System',
    duration_minutes: 60,
    capacity: 1,
    admin_notes: '',
  },
  {
    id: 'maintenance',
    name: 'Routine Maintenance / Service',
    duration_minutes: 60,
    capacity: 1,
    admin_notes: '',
  },
];

export async function GET() {
  try {
    // Return hardcoded services (can be overridden by database settings in the future)
    return NextResponse.json({
      success: true,
      service_types: DEFAULT_SERVICE_TYPES,
    });
  } catch (error) {
    console.error('Failed to fetch service types:', error);
    // Even on error, return default services
    return NextResponse.json({
      success: true,
      service_types: DEFAULT_SERVICE_TYPES,
    });
  }
}

