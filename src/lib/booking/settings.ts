import { createClient } from '@/lib/supabase/server';
import type { Settings, ServiceType } from './types';

// Helper function to extract value from JSONB
function extractValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's already a primitive or object, return as-is
  if (typeof value !== 'string') {
    return value;
  }
  
  // If it's a JSON string, try to parse it
  try {
    const parsed = JSON.parse(value);
    // If parsed result is a string (was double-encoded), return it
    // Otherwise return the parsed value
    return parsed;
  } catch {
    // If parsing fails, it's just a regular string
    return value;
  }
}

// Helper function to get string value from JSONB
function getStringValue(value: unknown, defaultValue: string = ''): string {
  const extracted = extractValue(value);
  if (typeof extracted === 'string') {
    // Remove quotes if double-encoded
    return extracted.replace(/^"|"$/g, '') || defaultValue;
  }
  return defaultValue;
}

// Helper function to get number value from JSONB
function getNumberValue(value: unknown, defaultValue: number = 0): number {
  const extracted = extractValue(value);
  if (typeof extracted === 'number') {
    return extracted;
  }
  if (typeof extracted === 'string') {
    const num = Number(extracted);
    return isNaN(num) ? defaultValue : num;
  }
  return defaultValue;
}

// Helper function to get boolean value from JSONB
function getBooleanValue(value: unknown, defaultValue: boolean = false): boolean {
  const extracted = extractValue(value);
  if (typeof extracted === 'boolean') {
    return extracted;
  }
  if (typeof extracted === 'string') {
    return extracted.toLowerCase() === 'true';
  }
  return defaultValue;
}

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  const settingsMap = new Map(data.map(s => [s.key, s.value]));
  
  // Helper to get optional string
  const getOptionalString = (key: string): string | undefined => {
    const value = extractValue(settingsMap.get(key));
    if (value === null || value === undefined) return undefined;
    const str = typeof value === 'string' ? value.replace(/^"|"$/g, '') : String(value);
    // Handle empty string or '""' as undefined
    if (str === '' || str === '""') return undefined;
    return str;
  };
  
  // Helper to get working hours
  const getWorkingHours = (): Record<string, { open: string; close: string; enabled: boolean }> => {
    const value = extractValue(settingsMap.get('working_hours'));
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, { open: string; close: string; enabled: boolean }>;
    }
    return {};
  };
  
  // Helper to get service types
  const getServiceTypes = (): ServiceType[] => {
    const value = extractValue(settingsMap.get('service_types'));
    if (Array.isArray(value)) {
      return value as ServiceType[];
    }
    return [];
  };
  
  return {
    business_name: getStringValue(settingsMap.get('business_name'), 'MBR Auto Services'),
    timezone: getStringValue(settingsMap.get('timezone'), 'Asia/Dubai'),
    business_address: getStringValue(settingsMap.get('business_address'), ''),
    google_maps_link: getOptionalString('google_maps_link'),
    slot_duration_minutes: getNumberValue(settingsMap.get('slot_duration_minutes'), 30),
    slot_capacity: getNumberValue(settingsMap.get('slot_capacity'), 1),
    lead_time_hours: getNumberValue(settingsMap.get('lead_time_hours'), 2),
    max_future_days: getNumberValue(settingsMap.get('max_future_days'), 90),
    confirmation_expiry_minutes: getNumberValue(settingsMap.get('confirmation_expiry_minutes'), 30),
    google_calendar_id: getOptionalString('google_calendar_id'),
    google_calendar_conflict_check: getBooleanValue(settingsMap.get('google_calendar_conflict_check'), false),
    smtp_host: getStringValue(settingsMap.get('smtp_host'), ''),
    smtp_port: getNumberValue(settingsMap.get('smtp_port'), 587),
    smtp_username: getStringValue(settingsMap.get('smtp_username'), ''),
    smtp_from: getStringValue(settingsMap.get('smtp_from'), ''),
    email_include_ics: getBooleanValue(settingsMap.get('email_include_ics'), true),
    email_include_google_calendar_link: getBooleanValue(settingsMap.get('email_include_google_calendar_link'), true),
    email_include_google_maps_link: getBooleanValue(settingsMap.get('email_include_google_maps_link'), true),
    working_hours: getWorkingHours(),
    service_types: getServiceTypes(),
  };
}

export async function getServiceTypes(): Promise<ServiceType[]> {
  const settings = await getSettings();
  return settings.service_types;
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  const supabase = await createClient();
  
  // Ensure value is properly formatted for JSONB
  // If it's already an object/array, it will be stored as JSONB
  // If it's a primitive, wrap it appropriately
  let jsonbValue: unknown = value;
  
  // For strings, numbers, booleans - store as-is (Supabase handles JSONB conversion)
  // For objects/arrays - store directly
  // For undefined/null - store as null
  if (value === undefined) {
    jsonbValue = null;
  }
  
  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value: jsonbValue,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key'
    });

  if (error) {
    console.error('Supabase update error:', error);
    throw new Error(`Failed to update setting: ${error.message}`);
  }
}

