import { createClient } from '@/lib/supabase/server';
import type { Settings, ServiceType } from './types';

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  const settingsMap = new Map(data.map(s => [s.key, s.value]));
  
  return {
    business_name: settingsMap.get('business_name') as string || 'MBR Auto Services',
    timezone: settingsMap.get('timezone') as string || 'Asia/Dubai',
    business_address: settingsMap.get('business_address') as string || '',
    google_maps_link: settingsMap.get('google_maps_link') as string | undefined,
    slot_duration_minutes: Number(settingsMap.get('slot_duration_minutes')) || 30,
    slot_capacity: Number(settingsMap.get('slot_capacity')) || 1,
    lead_time_hours: Number(settingsMap.get('lead_time_hours')) || 2,
    max_future_days: Number(settingsMap.get('max_future_days')) || 90,
    confirmation_expiry_minutes: Number(settingsMap.get('confirmation_expiry_minutes')) || 30,
    google_calendar_id: settingsMap.get('google_calendar_id') as string | undefined,
    google_calendar_conflict_check: Boolean(settingsMap.get('google_calendar_conflict_check')),
    smtp_host: settingsMap.get('smtp_host') as string || '',
    smtp_port: Number(settingsMap.get('smtp_port')) || 587,
    smtp_username: settingsMap.get('smtp_username') as string || '',
    smtp_from: settingsMap.get('smtp_from') as string || '',
    email_include_ics: Boolean(settingsMap.get('email_include_ics') ?? true),
    email_include_google_calendar_link: Boolean(settingsMap.get('email_include_google_calendar_link') ?? true),
    email_include_google_maps_link: Boolean(settingsMap.get('email_include_google_maps_link') ?? true),
    working_hours: settingsMap.get('working_hours') as Record<string, { open: string; close: string; enabled: boolean }> || {},
    service_types: (settingsMap.get('service_types') as ServiceType[]) || [],
  };
}

export async function getServiceTypes(): Promise<ServiceType[]> {
  const settings = await getSettings();
  return settings.service_types;
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`);
  }
}

