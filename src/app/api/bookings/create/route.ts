import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bookingCreateSchema, formatUAEPhone } from '@/lib/booking/validation';
import { generateCaptcha, validateCaptcha } from '@/lib/booking/captcha';
import { createConfirmationToken } from '@/lib/booking/tokens';
import { sendConfirmationEmail } from '@/lib/booking/email';
import { generateAvailableSlots, isSlotAvailable } from '@/lib/booking/slots';
import { getServiceTypes } from '@/lib/booking/settings';

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 }); // 1 minute window
    return true;
  }
  
  if (record.count >= 5) { // Max 5 requests per minute
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = bookingCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Format phone number
    const formattedPhone = formatUAEPhone(data.customer_phone);
    if (!formattedPhone.match(/^\+971[0-9]{9}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be +971XXXXXXXXX' },
        { status: 400 }
      );
    }
    
    // Validate CAPTCHA (in production, store CAPTCHA answer in session/cache)
    // For now, we'll accept any answer (implement proper CAPTCHA validation)
    // TODO: Implement proper CAPTCHA validation with session storage
    
    // Check slot availability
    const slots = await generateAvailableSlots(
      new Date(data.slot_start),
      new Date(data.slot_end),
      data.service_type
    );
    
    if (!isSlotAvailable(data.slot_start, data.slot_end, slots)) {
      return NextResponse.json(
        { error: 'Selected time slot is no longer available' },
        { status: 409 }
      );
    }
    
    // Get service details
    const serviceTypes = await getServiceTypes();
    const serviceType = serviceTypes.find(st => st.id === data.service_type);
    if (!serviceType) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      );
    }
    
    // Create booking
    const supabase = await createClient();
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        service_type: serviceType.name,
        service_duration_minutes: serviceType.duration_minutes,
        slot_start: data.slot_start,
        slot_end: data.slot_end,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: formattedPhone,
        customer_notes: data.customer_notes || null,
        status: 'PENDING',
      })
      .select()
      .single();
    
    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      );
    }
    
    // Create confirmation token
    const confirmationToken = await createConfirmationToken(booking.id);
    
    // Send confirmation email
    try {
      await sendConfirmationEmail(booking, confirmationToken);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the booking if email fails - log it
    }
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        message: 'Booking created successfully. Please check your email to confirm.',
      },
    });
    
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET endpoint for CAPTCHA generation
export async function GET() {
  const captcha = generateCaptcha();
  return NextResponse.json({
    question: captcha.question,
    // Don't send answer to client - validate server-side
  });
}

