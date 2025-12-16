import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from './settings';

export async function createConfirmationToken(bookingId: string): Promise<string> {
  // Use admin client to bypass RLS for token creation
  const { createAdminClient } = await import('@/lib/supabase/server');
  const supabase = createAdminClient();
  const settings = await getSettings();
  
  console.log('Creating confirmation token for booking:', bookingId);
  
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  console.log('Generated token (first 8 chars):', token.substring(0, 8) + '...');
  
  // Hash token for storage
  const tokenHash = await bcrypt.hash(token, 10);
  console.log('Token hashed successfully');
  
  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + settings.confirmation_expiry_minutes);
  console.log('Token expires at:', expiresAt.toISOString());
  
  // Store in database
  const { error } = await supabase
    .from('confirmation_tokens')
    .insert({
      booking_id: bookingId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });
  
  if (error) {
    console.error('Failed to insert confirmation token:', error);
    throw new Error(`Failed to create confirmation token: ${error.message}`);
  }
  
  console.log('✅ Confirmation token stored in database');
  return token;
}

export async function validateConfirmationToken(token: string): Promise<{
  valid: boolean;
  bookingId?: string;
  expired?: boolean;
}> {
  const supabase = await createClient();
  
  // Get all tokens (we need to check each hash)
  const { data: tokens, error } = await supabase
    .from('confirmation_tokens')
    .select('id, booking_id, token_hash, expires_at, used_at')
    .is('used_at', null)
    .gte('expires_at', new Date().toISOString());
  
  if (error) {
    throw new Error(`Failed to validate token: ${error.message}`);
  }
  
  if (!tokens || tokens.length === 0) {
    return { valid: false, expired: true };
  }
  
  // Check each token hash
  for (const tokenRecord of tokens) {
    const isValid = await bcrypt.compare(token, tokenRecord.token_hash);
    
    if (isValid) {
      // Check if expired
      const expiresAt = new Date(tokenRecord.expires_at);
      if (expiresAt < new Date()) {
        return { valid: false, expired: true };
      }
      
      // Mark as used
      await supabase
        .from('confirmation_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenRecord.id);
      
      return {
        valid: true,
        bookingId: tokenRecord.booking_id,
      };
    }
  }
  
  return { valid: false };
}

