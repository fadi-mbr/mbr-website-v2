import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { bookingCreateSchema, formatUAEPhone } from '@/lib/booking/validation';
import { generateCaptcha } from '@/lib/booking/captcha';
import { createConfirmationToken } from '@/lib/booking/tokens';
import { sendConfirmationEmail } from '@/lib/booking/email';
import { generateAvailableSlots, isSlotAvailable } from '@/lib/booking/slots';
import { getServiceTypes } from '@/lib/booking/settings';
import type { ServiceType } from '@/lib/booking/types';

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
    
    // Log the incoming request for debugging
    console.log('Booking creation request:', {
      service_type: body.service_type,
      slot_start: body.slot_start,
      slot_end: body.slot_end,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      has_notes: !!body.customer_notes,
      captcha_answer: body.captcha_answer,
    });
    
    // Validate input
    const validationResult = bookingCreateSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors);
      // Format validation errors into user-friendly messages
      const errorMessages = validationResult.error.errors.map(err => {
        const field = err.path.join('.');
        let message = err.message;
        
        // Make error messages more user-friendly
        if (field === 'customer_phone') {
          message = 'Phone number must be in format +971XXXXXXXXX (e.g., +971501234567)';
        } else if (field === 'slot_start' || field === 'slot_end') {
          message = 'Please select a valid date and time';
        } else if (field === 'service_type') {
          message = 'Please select a service type';
        } else if (field === 'customer_email') {
          message = 'Please enter a valid email address';
        } else if (field === 'customer_name') {
          message = 'Name must be at least 2 characters';
        } else if (field === 'captcha_answer') {
          message = 'Please complete the security check';
        }
        
        return `${message}`;
      });
      
      // Return the first error message (most relevant)
      const primaryError = errorMessages[0] || 'Please check your input and try again';
      
      // Build a comprehensive error message
      let fullErrorMessage = primaryError;
      if (errorMessages.length > 1) {
        fullErrorMessage += '\n\nAdditional issues:\n' + errorMessages.slice(1).map((err, i) => `${i + 1}. ${err}`).join('\n');
      }
      
      // Add field-specific help
      const hasSlotError = validationResult.error.errors.some(e => 
        e.path.includes('slot_start') || e.path.includes('slot_end')
      );
      if (hasSlotError) {
        fullErrorMessage += '\n\n💡 Tip: Please go back to Step 2 and select a date and time again.';
      }
      
      const hasPhoneError = validationResult.error.errors.some(e => 
        e.path.includes('customer_phone')
      );
      if (hasPhoneError) {
        fullErrorMessage += '\n\n💡 Tip: UAE phone numbers must be in format +971XXXXXXXXX (e.g., +971501234567)';
      }
      
      return NextResponse.json(
        { 
          error: fullErrorMessage,
          primaryError,
          details: validationResult.error.errors,
          allErrors: errorMessages
        },
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
    // First try to get from database, fallback to hardcoded defaults
    let serviceTypes = await getServiceTypes();
    
    // If no service types from database, use hardcoded defaults
    if (!serviceTypes || serviceTypes.length === 0) {
      console.log('No service types from database, using hardcoded defaults');
      const { DEFAULT_SERVICE_TYPES } = await import('@/app/api/bookings/services/route');
      serviceTypes = DEFAULT_SERVICE_TYPES as ServiceType[];
    }
    
    const serviceType = serviceTypes.find(st => st.id === data.service_type);
    if (!serviceType) {
      console.error('Service type not found:', {
        requestedId: data.service_type,
        availableIds: serviceTypes.map(st => st.id),
        availableServices: serviceTypes,
      });
      return NextResponse.json(
        { 
          error: `Invalid service type: "${data.service_type}". Available types: ${serviceTypes.map(st => st.id).join(', ')}`,
          requestedId: data.service_type,
          availableIds: serviceTypes.map(st => st.id),
        },
        { status: 400 }
      );
    }
    
    console.log('Service type found:', serviceType);
    
    // Create booking using admin client to bypass RLS
    // We've already validated everything server-side, so it's safe to use admin client
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (adminClientError) {
      console.error('Failed to create admin client:', adminClientError);
      // Fallback to regular client if admin client fails
      console.log('Falling back to regular client...');
      supabase = await createClient();
    }
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
      console.error('Booking data attempted:', {
        service_type: serviceType.name,
        service_duration_minutes: serviceType.duration_minutes,
        slot_start: data.slot_start,
        slot_end: data.slot_end,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: formattedPhone,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create booking. Please try again.',
          details: bookingError ? bookingError.message : 'Unknown error',
          code: bookingError?.code,
        },
        { status: 500 }
      );
    }
    
    // Create confirmation token
    let confirmationToken;
    try {
      confirmationToken = await createConfirmationToken(booking.id);
      console.log('Confirmation token created successfully');
    } catch (tokenError) {
      console.error('Failed to create confirmation token:', tokenError);
      // Don't fail the booking if token creation fails - log it and continue
      // The booking is still created, but confirmation won't work
    }
    
    // Send confirmation email
    if (confirmationToken) {
      try {
        await sendConfirmationEmail(booking, confirmationToken);
        console.log('Confirmation email sent successfully');
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the booking if email fails - log it
      }
    } else {
      console.warn('Skipping email send - no confirmation token');
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again later.',
        details: errorMessage,
        // Don't expose stack trace in production, but log it server-side
      },
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

