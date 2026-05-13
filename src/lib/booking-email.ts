/**
 * Nodemailer wrapper — sends the pre-relationship "Confirm your booking" email
 * for the public booking flow over SMTP.
 *
 * Transport: ImprovMX SMTP relay (smtp.improvmx.com:587, STARTTLS).
 * Configured at runtime via env vars:
 *   BOOKING_SMTP_HOST, BOOKING_SMTP_PORT,
 *   BOOKING_SMTP_USER, BOOKING_SMTP_PASSWORD,
 *   BOOKING_FROM_EMAIL  (e.g. booking@mail.mbrme.com — DKIM-authenticated)
 *
 * Failure mode: never throws. Returns `{ ok: false, error }` so the route
 * can decide how to surface it (typically: log + return a generic 200 so
 * we don't leak whether an address exists).
 *
 * Body rendering lives in `booking-email-template.ts`. This module owns
 * only the SMTP transport plumbing and the subject line; the visual
 * template (header, summary card, CTA button, footer) is in the template
 * module so it can be edited without touching transport code.
 *
 * Tests use a module seam (`_setMailerForTests`) to inject a fake
 * transporter — nodemailer's `createTransport` returns a stateful object
 * that's awkward to re-construct per test.
 */

import nodemailer from "nodemailer";
import {
  renderConfirmationEmailHtml,
  renderConfirmationEmailText,
  escapeHtml as templateEscapeHtml,
  formatDubai as templateFormatDubai,
} from "./booking-email-template";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface ConfirmationEmailInput {
  smtp: SmtpConfig;
  fromEmail: string;
  to: string;
  firstName: string;
  serviceName: string;
  /** Epoch ms or Date — formatted in Asia/Dubai locale for display. */
  requestedAt: Date | number;
  /** Fully-qualified confirm URL with `?token=...`. */
  confirmUrl: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Test seam — lets unit tests inject a fake transporter without touching
// nodemailer's network layer.
// ---------------------------------------------------------------------------

export interface TransporterLike {
  sendMail(msg: Record<string, unknown>): Promise<unknown>;
}

let injectedTransporter: TransporterLike | null = null;

export function _setMailerForTests(impl: TransporterLike): void {
  injectedTransporter = impl;
}

export function _resetMailerForTests(): void {
  injectedTransporter = null;
}

function buildTransporter(smtp: SmtpConfig): TransporterLike {
  if (injectedTransporter) return injectedTransporter;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: false,
    requireTLS: true,
    auth: { user: smtp.user, pass: smtp.password },
  }) as unknown as TransporterLike;
}

// ---------------------------------------------------------------------------
// Subject + body builders
// ---------------------------------------------------------------------------
//
// The HTML/text body builders moved to booking-email-template.ts. We
// re-export them here under the historical names so older imports
// (and tests) keep working.

export const CONFIRMATION_SUBJECT =
  "Confirm your booking at MBR — expires in 30 minutes";

/** Re-export for back-compat — escapes the five HTML special chars. */
export const escapeHtml = templateEscapeHtml;

/** Re-export for back-compat — formats a timestamp in Asia/Dubai locale. */
export const formatDubai = templateFormatDubai;

/** Re-export under the legacy name. */
export const renderConfirmationHtml = renderConfirmationEmailHtml;

/** Re-export under the legacy name. */
export const renderConfirmationText = renderConfirmationEmailText;

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

export async function sendConfirmationEmail(
  input: ConfirmationEmailInput,
): Promise<SendResult> {
  if (!input.smtp || !input.smtp.host) return { ok: false, error: "missing_smtp_host" };
  if (!input.smtp.user) return { ok: false, error: "missing_smtp_user" };
  if (!input.smtp.password) return { ok: false, error: "missing_smtp_password" };
  if (!input.fromEmail) return { ok: false, error: "missing_from_email" };
  if (!input.to) return { ok: false, error: "missing_to" };

  try {
    const transporter = buildTransporter(input.smtp);
    await transporter.sendMail({
      to: input.to,
      from: input.fromEmail,
      replyTo: input.fromEmail,
      subject: CONFIRMATION_SUBJECT,
      text: renderConfirmationEmailText({
        firstName: input.firstName,
        serviceName: input.serviceName,
        requestedAt: input.requestedAt,
        confirmUrl: input.confirmUrl,
      }),
      html: renderConfirmationEmailHtml({
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
