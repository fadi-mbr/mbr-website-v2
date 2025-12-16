import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from './settings';

export async function createConfirmationToken(bookingId: string): Promise<string> {
  const supabase = await createClient();
  const settings = await getSettings();
  
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash token for storage
  const tokenHash = await bcrypt.hash(token, 10);
  
  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + settings.confirmation_expiry_minutes);
  
  // Store in database
  const { error } = await supabase
    .from('confirmation_tokens')
    .insert({
      booking_id: bookingId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });
  
  if (error) {
    throw new Error(`Failed to create confirmation token: ${error.message}`);
  }
  
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

