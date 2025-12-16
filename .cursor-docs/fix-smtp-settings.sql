-- Fix SMTP Settings in Database
-- Run this in Supabase SQL Editor to add missing SMTP host

-- Check current SMTP settings
SELECT key, value FROM settings 
WHERE key IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_from')
ORDER BY key;

-- Add or update SMTP host (if missing)
INSERT INTO settings (key, value, description)
VALUES ('smtp_host', '"smtp.improvmx.com"', 'SMTP server hostname')
ON CONFLICT (key) 
DO UPDATE SET 
  value = '"smtp.improvmx.com"',
  description = 'SMTP server hostname',
  updated_at = NOW();

-- Verify SMTP settings are correct
SELECT key, value, description FROM settings 
WHERE key IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_from')
ORDER BY key;

