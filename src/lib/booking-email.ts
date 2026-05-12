/**
 * SendGrid wrapper — sends the pre-relationship "Confirm your booking" email
 * for the public booking flow.
 *
 * Failure mode: never throws. Returns `{ ok: false, error }` so the route
 * can decide how to surface it (typically: log + return a generic 200 so
 * we don't leak whether an address exists).
 *
 * HTML escaping: user-supplied strings (firstName, serviceName) are escaped
 * before interpolation. The confirmUrl is *not* escaped because it must
 * round-trip its base64url segments through the `href` attribute; callers
 * MUST pass an already-validated absolute URL.
 *
 * Tests use a module seam (`_setMailerForTests`) to inject a fake mailer
 * — `@sendgrid/mail` is awkward to deep-mock because its default export
 * is a singleton.
 */

import sgMail from "@sendgrid/mail";

export interface ConfirmationEmailInput {
  apiKey: string;
  fromEmail: string;
  to: string;
  firstName: string;
  serviceName: string;
  /** Epoch ms — formatted in Asia/Dubai locale for display. */
  requestedAt: number;
  /** Fully-qualified confirm URL with `?token=...`. */
  confirmUrl: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Test seam — lets unit tests inject a fake mailer without touching SendGrid.
// ---------------------------------------------------------------------------

export interface MailerLike {
  setApiKey(key: string): void;
  send(msg: Record<string, unknown>): Promise<unknown>;
}

let activeMailer: MailerLike = sgMail as unknown as MailerLike;

export function _setMailerForTests(impl: MailerLike): void {
  activeMailer = impl;
}

export function _resetMailerForTests(): void {
  activeMailer = sgMail as unknown as MailerLike;
}

// ---------------------------------------------------------------------------
// HTML escape
// ---------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Date formatting (Asia/Dubai)
// ---------------------------------------------------------------------------

export function formatDubai(epochMs: number): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(epochMs));
  } catch {
    return new Date(epochMs).toISOString();
  }
}

// ---------------------------------------------------------------------------
// Subject + body builders (exported for tests)
// ---------------------------------------------------------------------------

export const CONFIRMATION_SUBJECT =
  "Confirm your booking at MBR — expires in 30 minutes";

const BRAND_BG = "#000";
const BRAND_FG = "#ffffff";
const BRAND_ACCENT = "#b08d57";
const FOOTER_TEXT =
  "If you didn't request this, ignore this email — no booking will be created. MBR Auto Services · Al Quoz, Dubai";

export function renderConfirmationHtml(input: {
  firstName: string;
  serviceName: string;
  requestedAt: number;
  confirmUrl: string;
}): string {
  const safeFirstName = escapeHtml(input.firstName || "there");
  const safeServiceName = escapeHtml(input.serviceName);
  const when = escapeHtml(formatDubai(input.requestedAt));
  const safeUrl = escapeHtml(input.confirmUrl);

  return [
    `<!doctype html>`,
    `<html><body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND_FG};">`,
    `<div style="max-width:560px;margin:0 auto;padding:32px 24px;background:${BRAND_BG};color:${BRAND_FG};">`,
    `<h1 style="font-size:22px;font-weight:600;margin:0 0 16px 0;color:${BRAND_ACCENT};">Confirm your booking</h1>`,
    `<p style="font-size:15px;line-height:1.5;margin:0 0 12px 0;color:${BRAND_FG};">Hi ${safeFirstName},</p>`,
    `<p style="font-size:15px;line-height:1.5;margin:0 0 24px 0;color:${BRAND_FG};">We received a booking request for <strong style="color:${BRAND_ACCENT};">${safeServiceName}</strong> on <strong>${when}</strong>. Click below to confirm — the link expires in 30 minutes.</p>`,
    `<p style="margin:24px 0;text-align:center;">`,
    `<a href="${safeUrl}" style="display:inline-block;background:${BRAND_ACCENT};color:${BRAND_BG};text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;">Confirm booking</a>`,
    `</p>`,
    `<p style="font-size:13px;line-height:1.5;margin:24px 0 8px 0;color:#999;">If the button doesn't work, paste this link into your browser:</p>`,
    `<p style="font-size:13px;line-height:1.5;margin:0 0 32px 0;color:#bbb;word-break:break-all;">${safeUrl}</p>`,
    `<hr style="border:none;border-top:1px solid #222;margin:24px 0;">`,
    `<p style="font-size:12px;line-height:1.5;margin:0;color:#777;">${escapeHtml(FOOTER_TEXT)}</p>`,
    `</div></body></html>`,
  ].join("");
}

export function renderConfirmationText(input: {
  firstName: string;
  serviceName: string;
  requestedAt: number;
  confirmUrl: string;
}): string {
  const when = formatDubai(input.requestedAt);
  return [
    `Hi ${input.firstName || "there"},`,
    ``,
    `We received a booking request for ${input.serviceName} on ${when}.`,
    `Click the link below to confirm — it expires in 30 minutes.`,
    ``,
    input.confirmUrl,
    ``,
    `--`,
    FOOTER_TEXT,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

export async function sendConfirmationEmail(
  input: ConfirmationEmailInput,
): Promise<SendResult> {
  if (!input.apiKey) return { ok: false, error: "missing_api_key" };
  if (!input.fromEmail) return { ok: false, error: "missing_from_email" };
  if (!input.to) return { ok: false, error: "missing_to" };

  try {
    activeMailer.setApiKey(input.apiKey);
    await activeMailer.send({
      to: input.to,
      from: input.fromEmail,
      replyTo: input.fromEmail,
      subject: CONFIRMATION_SUBJECT,
      text: renderConfirmationText({
        firstName: input.firstName,
        serviceName: input.serviceName,
        requestedAt: input.requestedAt,
        confirmUrl: input.confirmUrl,
      }),
      html: renderConfirmationHtml({
        firstName: input.firstName,
        serviceName: input.serviceName,
        requestedAt: input.requestedAt,
        confirmUrl: input.confirmUrl,
      }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
