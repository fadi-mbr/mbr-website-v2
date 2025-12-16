import nodemailer from 'nodemailer';
import { DateTime } from 'luxon';
import { getSettings } from './settings';
import type { Booking } from './types';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) {
    return transporter;
  }
  
  // Use admin client to read settings (bypasses RLS)
  // This is safe because we're reading public configuration, not sensitive data
  const settings = await getSettings(true);
  
  // Get SMTP configuration with fallbacks
  // Handle empty strings by treating them as missing
  let smtpHost = (settings.smtp_host && settings.smtp_host.trim()) || process.env.SMTP_HOST || '';
  const smtpPort = settings.smtp_port || parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUsername = (settings.smtp_username && settings.smtp_username.trim()) || process.env.SMTP_USERNAME || process.env.SMTP_USER || '';
  const smtpFrom = (settings.smtp_from && settings.smtp_from.trim()) || process.env.SMTP_FROM || smtpUsername;
  
  console.log('SMTP Configuration Check:', {
    smtpHost_from_settings: settings.smtp_host,
    smtpHost_after_fallback: smtpHost,
    smtpUsername_from_settings: settings.smtp_username,
    smtpUsername_after_fallback: smtpUsername,
    smtpFrom_from_settings: settings.smtp_from,
    smtpFrom_after_fallback: smtpFrom,
    smtpPort,
    env_SMTP_HOST: process.env.SMTP_HOST,
    env_SMTP_USERNAME: process.env.SMTP_USERNAME,
  });
  
  // Infer host from username if missing (for ImprovMX)
  if ((!smtpHost || smtpHost.trim() === '') && smtpUsername && smtpUsername.includes('@mail.mbrme.com')) {
    smtpHost = 'smtp.improvmx.com';
    console.log('ℹ️  Inferred SMTP host from username: smtp.improvmx.com');
  }
  
  // Also check for ImprovMX pattern in env vars
  if ((!smtpHost || smtpHost.trim() === '') && smtpUsername && smtpUsername.includes('improvmx')) {
    smtpHost = 'smtp.improvmx.com';
    console.log('ℹ️  Inferred SMTP host (ImprovMX pattern): smtp.improvmx.com');
  }
  
  // Final validation - check for empty strings
  const hasHost = smtpHost && smtpHost.trim() !== '';
  const hasUsername = smtpUsername && smtpUsername.trim() !== '';
  const hasFrom = smtpFrom && smtpFrom.trim() !== '';
  
  if (!hasHost || !hasUsername || !hasFrom) {
    const missing: string[] = [];
    if (!hasHost) missing.push('SMTP Host');
    if (!hasUsername) missing.push('SMTP Username');
    if (!hasFrom) missing.push('SMTP From Address');
    
    throw new Error(
      `SMTP settings not configured. Missing: ${missing.join(', ')}. ` +
      `Please configure these in Admin Dashboard → Settings → SMTP or set environment variables. ` +
      `Current values - Host: "${smtpHost}", Username: "${smtpUsername}", From: "${smtpFrom}"`
    );
  }
  
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!smtpPassword) {
    throw new Error('SMTP_PASSWORD environment variable is not set. Please add it to your environment variables.');
  }
  
  console.log('Creating SMTP transporter:', {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    username: smtpUsername,
    from: smtpFrom,
    hasPassword: !!smtpPassword,
  });
  
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
  });
  
  // Verify connection
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
  } catch (verifyError) {
    console.error('SMTP verification failed:', verifyError);
    throw new Error(`SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
  }
  
  return transporter;
}

export async function sendConfirmationEmail(
  booking: Booking,
  confirmationToken: string
): Promise<void> {
  const settings = await getSettings();
  const transporter = await getTransporter();
  
  const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mbrme.com'}/book/confirm?token=${confirmationToken}`;
  const expiryMinutes = settings.confirmation_expiry_minutes;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Your Booking - ${settings.business_name}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #E30613 0%, #FF1A2E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${settings.business_name}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #E30613; margin-top: 0;">Confirm Your Booking</h2>
        
        <p>Hello ${booking.customer_name},</p>
        
        <p>Thank you for booking with ${settings.business_name}. Please confirm your booking by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" style="background: #E30613; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Confirm Booking
          </a>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Booking Details:</h3>
          <p><strong>Service:</strong> ${booking.service_type}</p>
          <p><strong>Date & Time:</strong> ${DateTime.fromISO(booking.slot_start).setZone(settings.timezone).toFormat('EEEE, MMMM d, yyyy')} at ${DateTime.fromISO(booking.slot_start).setZone(settings.timezone).toFormat('h:mm a')}</p>
          <p><strong>Duration:</strong> ${booking.service_duration_minutes} minutes</p>
          <p><strong>Location:</strong> ${settings.business_address}</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Important:</strong> This confirmation link will expire in ${expiryMinutes} minutes. 
          If you don't confirm within this time, your booking will be automatically cancelled.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          If you did not make this booking, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>${settings.business_name}<br>${settings.business_address}</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Confirm Your Booking - ${settings.business_name}

Hello ${booking.customer_name},

Thank you for booking with ${settings.business_name}. Please confirm your booking by visiting:

${confirmationUrl}

Booking Details:
- Service: ${booking.service_type}
- Date & Time: ${DateTime.fromISO(booking.slot_start).setZone(settings.timezone).toFormat('EEEE, MMMM d, yyyy')} at ${DateTime.fromISO(booking.slot_start).setZone(settings.timezone).toFormat('h:mm a')}
- Duration: ${booking.service_duration_minutes} minutes
- Location: ${settings.business_address}

Important: This confirmation link will expire in ${expiryMinutes} minutes.

${settings.business_name}
${settings.business_address}
  `;
  
  try {
    const result = await transporter.sendMail({
      from: settings.smtp_from,
      to: booking.customer_email,
      subject: `Confirm Your Booking - ${settings.business_name}`,
      html,
      text,
    });
    console.log('Confirmation email sent successfully:', {
      messageId: result.messageId,
      to: booking.customer_email,
      from: settings.smtp_from,
    });
  } catch (sendError) {
    console.error('Failed to send confirmation email:', sendError);
    throw sendError; // Re-throw to be caught by caller
  }
}

export function generateICSFile(booking: Booking, settings: { timezone: string; business_address: string }): string {
  const start = DateTime.fromISO(booking.slot_start).setZone(settings.timezone);
  const end = DateTime.fromISO(booking.slot_end).setZone(settings.timezone);
  
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MBR Auto Services//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:booking-${booking.id}@mbrme.com`,
    `DTSTAMP:${DateTime.now().setZone(settings.timezone).toFormat("yyyyMMdd'T'HHmmss")}`,
    `DTSTART;TZID=${settings.timezone}:${start.toFormat("yyyyMMdd'T'HHmmss")}`,
    `DTEND;TZID=${settings.timezone}:${end.toFormat("yyyyMMdd'T'HHmmss")}`,
    `SUMMARY:MBR Booking – ${booking.service_type}`,
    `DESCRIPTION:Booking ID: ${booking.id}\\nCustomer: ${booking.customer_name}\\nPhone: ${booking.customer_phone}\\nEmail: ${booking.customer_email}${booking.customer_notes ? `\\nNotes: ${booking.customer_notes}` : ''}`,
    `LOCATION:${settings.business_address}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  return ics;
}

export async function sendConfirmedEmail(
  booking: Booking,
  googleCalendarLink?: string
): Promise<void> {
  const settings = await getSettings();
  const transporter = await getTransporter();
  
  console.log('Sending confirmed email to:', booking.customer_email);
  
  const googleMapsLink = settings.google_maps_link || 
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.business_address)}`;
  
  let calendarLinksHtml = '';
  if (settings.email_include_google_calendar_link && googleCalendarLink) {
    calendarLinksHtml += `<p><a href="${googleCalendarLink}" style="color: #E30613;">Add to Google Calendar</a></p>`;
  }
  if (settings.email_include_google_maps_link) {
    calendarLinksHtml += `<p><a href="${googleMapsLink}" style="color: #E30613;">View on Google Maps</a></p>`;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed - ${settings.business_name}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #E30613 0%, #FF1A2E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${settings.business_name}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #E30613; margin-top: 0;">Booking Confirmed! ✓</h2>
        
        <p>Hello ${booking.customer_name},</p>
        
        <p>Your booking has been confirmed. We look forward to serving you!</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Booking Details:</h3>
          <p><strong>Service:</strong> ${booking.service_type}</p>
          <p><strong>Date & Time:</strong> ${DateTime.fromISO(booking.slot_start).setZone(settings.timezone).toFormat('EEEE, MMMM d, yyyy')} at ${DateTime.fromISO(booking.slot_start).setZone(settings.timezone).toFormat('h:mm a')}</p>
          <p><strong>Duration:</strong> ${booking.service_duration_minutes} minutes</p>
          <p><strong>Location:</strong> ${settings.business_address}</p>
          ${booking.customer_notes ? `<p><strong>Your Notes:</strong> ${booking.customer_notes}</p>` : ''}
        </div>
        
        ${calendarLinksHtml ? `<div style="margin: 20px 0;">${calendarLinksHtml}</div>` : ''}
        
        <p>If you need to make any changes or have questions, please contact us.</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>${settings.business_name}<br>${settings.business_address}</p>
      </div>
    </body>
    </html>
  `;
  
  const attachments: Array<{
    filename: string;
    content: string;
    contentType: string;
  }> = [];
  
  if (settings.email_include_ics) {
    const icsContent = generateICSFile(booking, settings);
    attachments.push({
      filename: `booking-${booking.id}.ics`,
      content: icsContent,
      contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
    });
  }
  
  try {
    const result = await transporter.sendMail({
      from: settings.smtp_from,
      to: booking.customer_email,
      subject: `Booking Confirmed - ${settings.business_name}`,
      html,
      attachments,
    });
    console.log('Confirmed email sent successfully:', {
      messageId: result.messageId,
      to: booking.customer_email,
      from: settings.smtp_from,
      attachmentsCount: attachments.length,
    });
  } catch (sendError) {
    console.error('Failed to send confirmed email:', sendError);
    throw sendError; // Re-throw to be caught by caller
  }
}

