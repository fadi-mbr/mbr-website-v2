-- MBR Auto Services Booking System - Supabase Schema
-- PostgreSQL schema for online booking system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SETTINGS TABLE (Admin-configurable settings)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- ============================================
-- BOOKINGS TABLE (Main booking records)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type TEXT NOT NULL,
  service_duration_minutes INTEGER NOT NULL DEFAULT 30,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  google_event_id TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_start ON bookings(slot_start);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- ============================================
-- CONFIRMATION_TOKENS TABLE (Email confirmation tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_token_hash ON confirmation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_booking_id ON confirmation_tokens(booking_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_expires_at ON confirmation_tokens(expires_at);

-- ============================================
-- BOOKING_LOGS TABLE (Audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_created_at ON booking_logs(created_at DESC);

-- ============================================
-- BLOCKED_SLOTS TABLE (Admin-blocked time slots)
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_slot_start ON blocked_slots(slot_start);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_slot_end ON blocked_slots(slot_end);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bookings updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log booking actions
CREATE OR REPLACE FUNCTION log_booking_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO booking_logs (booking_id, action, details)
  VALUES (
    NEW.id,
    TG_OP,
    jsonb_build_object(
      'status', NEW.status,
      'service_type', NEW.service_type,
      'slot_start', NEW.slot_start,
      'customer_email', NEW.customer_email
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking logs
CREATE TRIGGER log_booking_changes
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_action();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Bookings: Public can insert (create bookings), but only admins can read/update
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM settings
      WHERE key = 'admin_emails'
      AND value::text LIKE '%' || (auth.jwt() ->> 'email') || '%'
    )
  );

-- Confirmation tokens: Public can read by token_hash (for confirmation)
CREATE POLICY "Public can read tokens for confirmation"
  ON confirmation_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

-- Booking logs: Admins only
CREATE POLICY "Admins can read booking logs"
  ON booking_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM settings
      WHERE key = 'admin_emails'
      AND value::text LIKE '%' || (auth.jwt() ->> 'email') || '%'
    )
  );

-- Blocked slots: Public can read (to check availability), admins can manage
CREATE POLICY "Public can read blocked slots"
  ON blocked_slots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage blocked slots"
  ON blocked_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM settings
      WHERE key = 'admin_emails'
      AND value::text LIKE '%' || (auth.jwt() ->> 'email') || '%'
    )
  );

-- Settings: Admins only
CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM settings
      WHERE key = 'admin_emails'
      AND value::text LIKE '%' || (auth.jwt() ->> 'email') || '%'
    )
  );

-- ============================================
-- INITIAL SETTINGS (Seed data)
-- ============================================
INSERT INTO settings (key, value, description) VALUES
  ('business_name', '"MBR Auto Services"', 'Business name'),
  ('timezone', '"Asia/Dubai"', 'Business timezone'),
  ('business_address', '"Al Quoz Industrial Area 4, Dubai, UAE"', 'Full business address'),
  ('google_maps_link', '"https://maps.app.goo.gl/P7vgB2XDpeRCMaH3A"', 'Google Maps link override'),
  ('slot_duration_minutes', '30', 'Default slot duration in minutes'),
  ('slot_capacity', '1', 'Default slot capacity'),
  ('lead_time_hours', '2', 'Minimum hours before booking'),
  ('max_future_days', '90', 'Maximum days in future for bookings'),
  ('confirmation_expiry_minutes', '30', 'Confirmation email expiry time'),
  ('google_calendar_id', '""', 'Google Calendar ID'),
  ('google_calendar_conflict_check', 'false', 'Enable conflict checking'),
  ('smtp_host', '""', 'SMTP host'),
  ('smtp_port', '587', 'SMTP port'),
  ('smtp_username', '""', 'SMTP username'),
  ('smtp_from', '""', 'SMTP from address'),
  ('email_include_ics', 'true', 'Include ICS attachment in confirmation email'),
  ('email_include_google_calendar_link', 'true', 'Include Google Calendar link'),
  ('email_include_google_maps_link', 'true', 'Include Google Maps link'),
  ('admin_emails', '["@mbrme.com"]', 'Allowed admin email domains'),
  ('working_hours', '{
    "monday": {"open": "08:30", "close": "19:30", "enabled": true},
    "tuesday": {"open": "08:30", "close": "19:30", "enabled": true},
    "wednesday": {"open": "08:30", "close": "19:30", "enabled": true},
    "thursday": {"open": "08:30", "close": "19:30", "enabled": true},
    "friday": {"open": "08:30", "close": "19:30", "enabled": true},
    "saturday": {"open": "08:30", "close": "19:30", "enabled": true},
    "sunday": {"open": "08:30", "close": "19:30", "enabled": false}
  }', 'Weekly working hours')
ON CONFLICT (key) DO NOTHING;

-- Service types configuration
INSERT INTO settings (key, value, description) VALUES
  ('service_types', '[
    {"id": "inspection", "name": "Vehicle Inspection & Diagnosis", "duration_minutes": 30, "capacity": 1, "admin_notes": ""},
    {"id": "mechanical", "name": "Mechanical Repair", "duration_minutes": 60, "capacity": 1, "admin_notes": ""},
    {"id": "electrical", "name": "Electrical & Battery Repair", "duration_minutes": 60, "capacity": 1, "admin_notes": ""},
    {"id": "body_paint", "name": "Body & Paint Repair", "duration_minutes": 60, "capacity": 1, "admin_notes": ""},
    {"id": "ac_cooling", "name": "AC & Cooling System", "duration_minutes": 60, "capacity": 1, "admin_notes": ""},
    {"id": "maintenance", "name": "Routine Maintenance / Service", "duration_minutes": 60, "capacity": 1, "admin_notes": ""}
  ]', 'Available service types')
ON CONFLICT (key) DO NOTHING;

