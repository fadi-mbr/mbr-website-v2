// Booking system type definitions

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface ServiceType {
  id: string;
  name: string;
  duration_minutes: number;
  capacity: number;
  admin_notes?: string;
}

export interface Booking {
  id: string;
  service_type: string;
  service_duration_minutes: number;
  slot_start: string;
  slot_end: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_notes?: string;
  status: BookingStatus;
  google_event_id?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  expired_at?: string;
}

export interface BookingCreateInput {
  service_type: string;
  slot_start: string;
  slot_end: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_notes?: string;
  captcha_answer: number;
}

export interface SlotAvailability {
  slot_start: string;
  slot_end: string;
  available: boolean;
  capacity: number;
  booked: number;
  status: 'available' | 'limited' | 'full';
}

export interface BookingLog {
  id: string;
  booking_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Settings {
  business_name: string;
  timezone: string;
  business_address: string;
  google_maps_link?: string;
  slot_duration_minutes: number;
  slot_capacity: number;
  lead_time_hours: number;
  max_future_days: number;
  confirmation_expiry_minutes: number;
  google_calendar_id?: string;
  google_calendar_conflict_check: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_from: string;
  email_include_ics: boolean;
  email_include_google_calendar_link: boolean;
  email_include_google_maps_link: boolean;
  working_hours: Record<string, {
    open: string;
    close: string;
    enabled: boolean;
  }>;
  service_types: ServiceType[];
}

