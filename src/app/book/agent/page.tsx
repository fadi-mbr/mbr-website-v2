/**
 * /book/agent — Chatwoot Dashboard App entry point.
 *
 * Loaded inside the Chatwoot conversation iframe with:
 *
 *   /book/agent?contact_id=<n>&conversation_id=<n>
 *
 * Server Component responsibilities:
 *
 *   1) Read `contact_id` + `conversation_id` from the URL.
 *   2) Fetch the contact server-side via `chatwoot-client.fetchContact()`
 *      so the admin token never reaches the browser.
 *   3) Fetch the service catalogue server-side from the existing
 *      `/api/booking/services` route.
 *   4) Render <BookingForm mode="agent" prefill={...} services={...}
 *      serverAction={agentSubmit} /> where `agentSubmit` is a Server
 *      Action that POSTs to `/api/booking/agent` with the shared agent
 *      secret in the `x-mbr-agent-secret` header.
 *
 * The page is robots-noindex. The CSP `frame-ancestors 'self'
 * https://connect.mbrme.com` set by next.config.ts covers `/book/*` so this
 * page is loadable inside the Chatwoot iframe.
 *
 * NOTE: This route is additive — the legacy `/book?embed=1` Dashboard App
 * URL keeps working until PR E (cutover) flips it to `/book/agent`.
 */

import type { Metadata } from 'next';
import BookingForm from '@/components/booking/BookingForm';
import type { BookingService } from '@/lib/booking-types';
import type {
  BookingSubmitPayload,
  ServerActionResult,
} from '@/components/booking/BookingFormClient';
import {
  fetchContact,
  loadChatwootConfig,
  type ChatwootContact,
} from '@/lib/chatwoot-client';

export const metadata: Metadata = {
  title: 'MBR Booking — Advisor',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Split a Chatwoot `name` into a (first, last) pair, never returning empty strings. */
function splitName(name?: string): { firstName?: string; lastName?: string } {
  if (!name) return {};
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function deriveBaseUrl(): string {
  // Vercel sets VERCEL_URL without protocol. Fall back to mbrme.com in
  // production-like envs; localhost for `next dev`.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') return 'https://mbrme.com';
  return 'http://localhost:3000';
}

async function loadServices(baseUrl: string): Promise<BookingService[]> {
  try {
    const r = await fetch(`${baseUrl}/api/booking/services`, {
      cache: 'no-store',
    });
    if (!r.ok) return [];
    return (await r.json()) as BookingService[];
  } catch {
    return [];
  }
}

function projectPrefill(contact: ChatwootContact | null): {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
} {
  if (!contact) return {};
  const { firstName, lastName } = splitName(contact.name);
  let phone: string | undefined;
  if (typeof contact.phone_number === 'string') {
    const cleaned = contact.phone_number.trim().replace(/^\+/, '');
    if (/^\d{6,15}$/.test(cleaned)) phone = cleaned;
  }
  const email =
    typeof contact.email === 'string' && contact.email.trim()
      ? contact.email.trim()
      : undefined;
  const out: { firstName?: string; lastName?: string; phone?: string; email?: string } = {};
  if (firstName) out.firstName = firstName;
  if (lastName) out.lastName = lastName;
  if (phone) out.phone = phone;
  if (email) out.email = email;
  return out;
}

interface PageProps {
  // Next.js 15: searchParams is a Promise on async server components.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AgentBookingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawContactId = Array.isArray(params.contact_id)
    ? params.contact_id[0]
    : params.contact_id;
  const rawConversationId = Array.isArray(params.conversation_id)
    ? params.conversation_id[0]
    : params.conversation_id;

  const contactId = rawContactId ? Number(rawContactId) : NaN;
  const conversationId = rawConversationId ? Number(rawConversationId) : NaN;

  const validIds =
    Number.isFinite(contactId) &&
    Number.isFinite(conversationId) &&
    Number.isInteger(contactId) &&
    Number.isInteger(conversationId) &&
    contactId > 0 &&
    conversationId > 0;

  if (!validIds) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="mx-auto max-w-[720px] px-4 py-10">
          <h1 className="text-xl font-light mb-2">Missing conversation context</h1>
          <p className="text-sm text-neutral-400">
            This page must be opened from the MBR Connect Dashboard App with
            a valid <code>contact_id</code> and <code>conversation_id</code>.
          </p>
        </main>
      </div>
    );
  }

  // ----- Prefill from Chatwoot (server-side; admin token never crosses the wire).
  let contact: ChatwootContact | null = null;
  const cfg = loadChatwootConfig();
  if (cfg) {
    const r = await fetchContact(cfg, contactId, 5_000);
    if (r.ok) contact = r.data;
  }
  const prefill = projectPrefill(contact);

  // ----- Service catalogue.
  const baseUrl = deriveBaseUrl();
  const services = await loadServices(baseUrl);

  // ----- Server Action — invoked from the client form on submit.
  //
  // Keeps `BOOKING_AGENT_SECRET` on the server. The action returns the
  // discriminated `ServerActionResult` shape the form renders directly.
  async function agentSubmit(
    payload: BookingSubmitPayload
  ): Promise<ServerActionResult> {
    'use server';
    const secret = process.env.BOOKING_AGENT_SECRET;
    if (!secret) {
      return {
        ok: false,
        code: 'AUTH',
        message:
          'Booking agent endpoint is not configured. Contact the platform team.',
      };
    }
    const actionBaseUrl = deriveBaseUrl();
    try {
      const res = await fetch(`${actionBaseUrl}/api/booking/agent`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'content-type': 'application/json',
          'x-mbr-agent-secret': secret,
        },
        body: JSON.stringify({
          ...payload,
          conversationId,
          contactId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok && data.ok === true) {
        return {
          ok: true,
          arcAppointmentId:
            typeof data.arcAppointmentId === 'number'
              ? data.arcAppointmentId
              : undefined,
          confirmAt: String(data.confirmAt ?? ''),
          serviceName: String(data.serviceName ?? ''),
          estimatedDuration:
            typeof data.estimatedDuration === 'number'
              ? data.estimatedDuration
              : 0,
        };
      }
      return {
        ok: false,
        code: typeof data.code === 'string' ? data.code : undefined,
        message:
          typeof data.message === 'string'
            ? data.message
            : `Booking failed (HTTP ${res.status}).`,
      };
    } catch (e) {
      return {
        ok: false,
        code: 'NETWORK',
        message:
          e instanceof Error
            ? `Booking request failed: ${e.message}`
            : 'Booking request failed.',
      };
    }
  }

  return (
    <BookingForm
      mode="agent"
      services={services}
      prefill={prefill}
      serverAction={agentSubmit}
    />
  );
}
