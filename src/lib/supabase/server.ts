import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates an admin Supabase client using the service role key.
 * This bypasses RLS policies and should ONLY be used for admin operations
 * that have already been authenticated via NextAuth.
 * 
 * WARNING: Never expose the service role key to the client!
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    // Provide helpful debugging info
    const envKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Available Supabase env vars:', envKeys);
    console.error('Make sure you have:');
    console.error('1. Added SUPABASE_SERVICE_ROLE_KEY to .env.local');
    console.error('2. Restarted your dev server (Ctrl+C then npm run dev)');
    console.error('3. The variable name is exactly: SUPABASE_SERVICE_ROLE_KEY (no typos)');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Required for admin operations. Please add it to your .env.local file and restart the dev server.');
  }
  
  // Log that we successfully loaded it (without exposing the key)
  if (serviceRoleKey && serviceRoleKey.length > 0) {
    console.log('✓ SUPABASE_SERVICE_ROLE_KEY loaded successfully');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

