import { z } from 'zod';

// UAE phone number validation: +971XXXXXXXXX
const uaePhoneRegex = /^\+971[0-9]{9}$/;

export const bookingCreateSchema = z.object({
  service_type: z.string().min(1, 'Service type is required'),
  slot_start: z.string().datetime('Invalid date format'),
  slot_end: z.string().datetime('Invalid date format'),
  customer_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().regex(uaePhoneRegex, 'Phone must be in format +971XXXXXXXXX'),
  customer_notes: z.string().max(1000, 'Notes too long').optional(),
  captcha_answer: z.number().int('CAPTCHA answer must be a number'),
});

export function validateUAEPhone(phone: string): boolean {
  return uaePhoneRegex.test(phone);
}

export function formatUAEPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 971, add +
  if (digits.startsWith('971')) {
    return `+${digits}`;
  }
  
  // If starts with 0, replace with +971
  if (digits.startsWith('0')) {
    return `+971${digits.slice(1)}`;
  }
  
  // If 9 digits, assume UAE number and add +971
  if (digits.length === 9) {
    return `+971${digits}`;
  }
  
  // Otherwise return as is (will fail validation)
  return phone;
}

