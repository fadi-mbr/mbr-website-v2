-- Fix RLS Policy for Bookings Table
-- Run this in Supabase SQL Editor if bookings are being blocked

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;

-- Create policy that allows public (anon) users to insert bookings
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify the policy exists
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
WHERE tablename = 'bookings';

