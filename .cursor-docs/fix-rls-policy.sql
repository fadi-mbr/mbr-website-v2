-- Fix RLS Policies for Booking System
-- Run this in Supabase SQL Editor if bookings or tokens are being blocked

-- ============================================
-- BOOKINGS TABLE
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;

-- Create policy that allows public (anon) users to insert bookings
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================
-- CONFIRMATION_TOKENS TABLE
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can create tokens" ON confirmation_tokens;

-- Create policy that allows public (anon) users to insert tokens
CREATE POLICY "Public can create tokens"
  ON confirmation_tokens FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Verify the policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('bookings', 'confirmation_tokens')
ORDER BY tablename, policyname;

