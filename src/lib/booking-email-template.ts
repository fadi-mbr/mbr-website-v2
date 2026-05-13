/**
 * Email body builder for the booking confirmation email.
 *
 * This module owns the *visual* template — the HTML body and the
 * plaintext fallback. The actual mailer wrapper (booking-email.ts)
 * delegates to these renderers and keeps the SMTP transport details.
 *
 * Design constraints (email-client compatibility):
 *   - Inline CSS only — no <style> blocks, no external CSS, no web fonts.
 *     Outlook + many corporate clients strip everything else.
 *   - Table-based layout for the card and button — best support across
 *     legacy mail clients including older Outlook builds.
 *   - HTML-escape every user-supplied value (firstName, serviceName)
 *     before interpolation. The confirmUrl must survive intact, so the
 *     callers MUST pre-validate it before it gets here.
 *   - Plaintext fallback must read cleanly on its own with no HTML
 *     dependencies. The confirm URL must appear on its own line so
 *     terminal mail clients linkify it.
 *
 * Brand:
 *   - Black header bar with the MBR horizontal logo (180px) and a small
 *     "Making Better Rides" tagline in bronze.
 *   - White body card, dark text, light-gray summary card.
 *   - Bronze (#b08d57) primary button with black text — 4.5+ WCAG AA
 *     contrast ratio.
 *
 * The MBR logo asset lives at https://mbrme.com/images/MBR_Logo_horizontal.svg
 * (Vercel deploy serves from the website's /public/images directory).
 */

export interface EmailTemplateInput {
  firstName: string;
  serviceName: string;
  /** Epoch ms or Date — formatted in Asia/Dubai locale for display. */
  requestedAt: Date | number;
  /** Fully-qualified confirm URL with `?token=...`. Pre-validated upstream. */
  confirmUrl: string;
}

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

const COLORS = {
  /** Header bar background — deep black, signals premium. */
  headerBg: '#000000',
  /** Bronze accent, used for the wordmark/tagline and the CTA button. */
  bronze: '#b08d57',
  /** Body background — clean white card. */
  bodyBg: '#ffffff',
  /** Outer canvas behind the card — soft gray so the card "lifts". */
  canvasBg: '#f4f4f4',
  /** Primary text color on white. */
  bodyText: '#1a1a1a',
  /** Muted text for secondary lines (expiry note, fine print). */
  mutedText: '#666666',
  /** Footer background — slightly darker than canvas. */
  footerBg: '#1a1a1a',
  /** Footer text — light gray on dark bg. */
  footerText: '#cccccc',
  /** Summary-card background — very light gray. */
  cardBg: '#f7f5f1',
  /** Summary-card border. */
  cardBorder: '#e5dfd2',
  /** Button text — pure black for max contrast on bronze. */
  buttonText: '#000000',
} as const;

const LOGO_URL = 'https://mbrme.com/images/MBR_Logo_horizontal.svg';
const ADDRESS = '16 8 St, Al Quoz Industrial 4, Dubai, UAE';
const PHONE_DISPLAY = '+971 56 501 5800';
const PHONE_TEL = '+971565015800';
const WHATSAPP_URL = 'https://wa.me/971565015800';
const TAGLINE = 'MAKING BETTER RIDES';
const CURRENT_YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format a timestamp in Asia/Dubai locale for the summary card.
 * Returns e.g. "Saturday, 16 May 2026 at 10:00 (GMT+4)".
 */
export function formatDubai(when: Date | number): string {
  const epochMs = typeof when === 'number' ? when : when.getTime();
  try {
    const dt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(epochMs));
    // en-GB long-form looks like "Saturday, 16 May 2026 at 10:00"
    // Intl already inserts " at " between date and time.
    return `${dt} (GMT+4)`;
  } catch {
    return new Date(epochMs).toISOString();
  }
}

// ---------------------------------------------------------------------------
// HTML body
// ---------------------------------------------------------------------------

export function renderConfirmationEmailHtml(input: EmailTemplateInput): string {
  const safeFirstName = escapeHtml(input.firstName?.trim() || 'there');
  const safeServiceName = escapeHtml(input.serviceName || 'your booking');
  const when = escapeHtml(formatDubai(input.requestedAt));
  // confirmUrl is pre-validated upstream; escape for HTML attribute safety.
  const safeUrl = escapeHtml(input.confirmUrl);

  // We build one long string. Each row of the email is a separate full-width
  // <table> for maximum mail-client compatibility (Outlook in particular).
  return [
    `<!doctype html>`,
    `<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your booking — MBR Auto Services</title></head>`,
    `<body style="margin:0;padding:0;background:${COLORS.canvasBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${COLORS.bodyText};-webkit-text-size-adjust:100%;">`,

    // Hidden pre-header (shown in inbox preview pane)
    `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${COLORS.canvasBg};opacity:0;">Tap to confirm your booking with MBR Auto Services. This link expires in 30 minutes.</div>`,

    // Outer canvas table
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.canvasBg};width:100%;">`,
    `<tr><td align="center" style="padding:24px 12px;">`,

    // Card container — 560px max-width
    `<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${COLORS.bodyBg};border-radius:8px;overflow:hidden;">`,

    // ----- Header (black bar with logo + tagline) -----
    `<tr><td align="center" style="background:${COLORS.headerBg};padding:28px 24px 20px 24px;">`,
    `<img src="${LOGO_URL}" width="180" alt="MBR Auto Services" style="display:block;width:180px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;">`,
    `<div style="margin-top:10px;font-size:11px;letter-spacing:2px;color:${COLORS.bronze};font-weight:600;">${TAGLINE}</div>`,
    `</td></tr>`,

    // ----- Body -----
    `<tr><td style="padding:32px 32px 16px 32px;background:${COLORS.bodyBg};">`,
    `<h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;font-weight:600;color:${COLORS.bodyText};">Confirm your booking</h1>`,
    `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;color:${COLORS.bodyText};">Hi ${safeFirstName},</p>`,
    `<p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:${COLORS.bodyText};">Thanks for booking with MBR Auto Services. Tap the button below to confirm your slot.</p>`,
    `</td></tr>`,

    // ----- Summary card (light gray, rounded) -----
    `<tr><td style="padding:0 32px 24px 32px;background:${COLORS.bodyBg};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.cardBg};border:1px solid ${COLORS.cardBorder};border-radius:6px;">`,
    `<tr><td style="padding:18px 20px;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">`,
    `<tr><td style="font-size:12px;font-weight:600;letter-spacing:1px;color:${COLORS.mutedText};text-transform:uppercase;padding-bottom:4px;">Service</td></tr>`,
    `<tr><td style="font-size:15px;color:${COLORS.bodyText};padding-bottom:14px;">${safeServiceName}</td></tr>`,
    `<tr><td style="font-size:12px;font-weight:600;letter-spacing:1px;color:${COLORS.mutedText};text-transform:uppercase;padding-bottom:4px;">When</td></tr>`,
    `<tr><td style="font-size:15px;color:${COLORS.bodyText};padding-bottom:14px;">${when}</td></tr>`,
    `<tr><td style="font-size:12px;font-weight:600;letter-spacing:1px;color:${COLORS.mutedText};text-transform:uppercase;padding-bottom:4px;">Where</td></tr>`,
    `<tr><td style="font-size:15px;color:${COLORS.bodyText};">MBR Auto Services &middot; Al Quoz Industrial 4, Dubai</td></tr>`,
    `</table>`,
    `</td></tr>`,
    `</table>`,
    `</td></tr>`,

    // ----- CTA button -----
    `<tr><td align="center" style="padding:8px 32px 8px 32px;background:${COLORS.bodyBg};">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0">`,
    `<tr><td align="center" bgcolor="${COLORS.bronze}" style="background:${COLORS.bronze};border-radius:6px;">`,
    `<a href="${safeUrl}" style="display:inline-block;padding:14px 34px;font-size:16px;font-weight:700;color:${COLORS.buttonText};text-decoration:none;letter-spacing:0.3px;">Confirm booking</a>`,
    `</td></tr>`,
    `</table>`,
    `</td></tr>`,

    // ----- Plaintext fallback URL -----
    `<tr><td style="padding:16px 32px 4px 32px;background:${COLORS.bodyBg};">`,
    `<p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.mutedText};">Or paste this link into your browser:</p>`,
    `<p style="margin:6px 0 0 0;font-size:13px;line-height:1.5;color:${COLORS.bronze};word-break:break-all;"><a href="${safeUrl}" style="color:${COLORS.bronze};text-decoration:underline;">${safeUrl}</a></p>`,
    `</td></tr>`,

    // ----- Expiry note -----
    `<tr><td style="padding:14px 32px 8px 32px;background:${COLORS.bodyBg};">`,
    `<p style="margin:0;font-size:13px;line-height:1.5;font-style:italic;color:${COLORS.mutedText};">This link expires in 30 minutes.</p>`,
    `</td></tr>`,

    // ----- Reassurance -----
    `<tr><td style="padding:8px 32px 28px 32px;background:${COLORS.bodyBg};">`,
    `<p style="margin:0;font-size:14px;line-height:1.5;color:${COLORS.bodyText};">Once you confirm, we'll see your booking in our calendar and our service advisor will reach out if we need any details.</p>`,
    `</td></tr>`,

    // ----- Footer (dark) -----
    `<tr><td style="padding:24px 32px;background:${COLORS.footerBg};color:${COLORS.footerText};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">`,
    `<tr><td style="font-size:13px;line-height:1.6;color:${COLORS.footerText};">`,
    `<div style="color:${COLORS.bronze};font-weight:600;letter-spacing:1px;font-size:12px;">MBR AUTO SERVICES</div>`,
    `<div style="margin-top:8px;">${ADDRESS}</div>`,
    `<div style="margin-top:4px;"><a href="tel:${PHONE_TEL}" style="color:${COLORS.footerText};text-decoration:none;">${PHONE_DISPLAY}</a> &middot; <a href="${WHATSAPP_URL}" style="color:${COLORS.footerText};text-decoration:none;">WhatsApp</a></div>`,
    `</td></tr>`,
    `<tr><td style="padding-top:14px;font-size:11px;line-height:1.5;color:#888888;">`,
    `If you didn't request this booking, please ignore this email — no record will be created.`,
    `</td></tr>`,
    `<tr><td style="padding-top:6px;font-size:11px;color:#666666;">&copy; ${CURRENT_YEAR} MBR Auto Services</td></tr>`,
    `</table>`,
    `</td></tr>`,

    `</table>`, // card
    `</td></tr>`,
    `</table>`, // canvas
    `</body></html>`,
  ].join('');
}

// ---------------------------------------------------------------------------
// Plaintext body
// ---------------------------------------------------------------------------

export function renderConfirmationEmailText(input: EmailTemplateInput): string {
  const firstName = (input.firstName?.trim() || 'there');
  const serviceName = input.serviceName || 'your booking';
  const when = formatDubai(input.requestedAt);

  return [
    `Hi ${firstName},`,
    ``,
    `Thanks for booking with MBR Auto Services. Confirm your slot using the link below.`,
    ``,
    `Service: ${serviceName}`,
    `When:    ${when}`,
    `Where:   MBR Auto Services, Al Quoz Industrial 4, Dubai`,
    ``,
    `Confirm your booking:`,
    input.confirmUrl,
    ``,
    `This link expires in 30 minutes.`,
    ``,
    `Once you confirm, we'll see your booking in our calendar and our service advisor will reach out if we need any details.`,
    ``,
    `--`,
    `MBR Auto Services`,
    `${ADDRESS}`,
    `${PHONE_DISPLAY} (call or WhatsApp: ${WHATSAPP_URL})`,
    ``,
    `If you didn't request this booking, please ignore this email — no record will be created.`,
  ].join('\n');
}
