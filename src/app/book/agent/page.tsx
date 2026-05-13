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
import { DashboardAppContextWaiter } from '@/components/booking/DashboardAppContextWaiter';
import type { BookingService } from '@/lib/booking-types';
import type {
  BookingSubmitPayload,
  ServerActionResult,
} from '@/components/booking/BookingFormClient';
import {
  fetchContact,
  fetchConversation,
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

/**
 * Project Chatwoot contact → form prefill.
 *
 * Surfaces:
 *   - name → firstName + lastName (via `splitName`)
 *   - phone_number → phone (digits only, 6-15)
 *   - email → email
 *   - custom_attributes.vehicle_year   → vehicleYear  (number or 4-digit string)
 *   - custom_attributes.vehicle_make   → vehicleMake
 *   - custom_attributes.vehicle_model  → vehicleModel
 *   - custom_attributes.vehicle_plate  → vehiclePlate (formatted plate string;
 *     the form decomposes it via `parsePlate` from src/lib/uae-plates.ts)
 *
 * Each attribute is read defensively — Chatwoot allows any user-set type
 * for custom_attributes, and we silently skip values of the wrong shape.
 */
export function projectPrefill(contact: ChatwootContact | null): {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
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
  const out: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    vehicleYear?: number;
    vehicleMake?: string;
    vehicleModel?: string;
    vehiclePlate?: string;
  } = {};
  if (firstName) out.firstName = firstName;
  if (lastName) out.lastName = lastName;
  if (phone) out.phone = phone;
  if (email) out.email = email;

  if (contact.custom_attributes && typeof contact.custom_attributes === 'object') {
    const ca = contact.custom_attributes as Record<string, unknown>;
    if (typeof ca.vehicle_year === 'number' && Number.isFinite(ca.vehicle_year)) {
      out.vehicleYear = ca.vehicle_year;
    } else if (
      typeof ca.vehicle_year === 'string' &&
      /^\d{4}$/.test(ca.vehicle_year)
    ) {
      out.vehicleYear = Number(ca.vehicle_year);
    }
    if (typeof ca.vehicle_make === 'string' && ca.vehicle_make.trim()) {
      out.vehicleMake = ca.vehicle_make.trim();
    }
    if (typeof ca.vehicle_model === 'string' && ca.vehicle_model.trim()) {
      out.vehicleModel = ca.vehicle_model.trim();
    }
    if (typeof ca.vehicle_plate === 'string' && ca.vehicle_plate.trim()) {
      out.vehiclePlate = ca.vehicle_plate.trim();
    }
  }

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

  let contactId = rawContactId ? Number(rawContactId) : NaN;
  const conversationId = rawConversationId ? Number(rawConversationId) : NaN;

  const validConversationId =
    Number.isFinite(conversationId) &&
    Number.isInteger(conversationId) &&
    conversationId > 0;
  const validContactId =
    Number.isFinite(contactId) &&
    Number.isInteger(contactId) &&
    contactId > 0;

  // The iframe URL only needs `conversation_id`; the contact is derivable
  // server-side from Chatwoot's conversation envelope (meta.sender.id).
  // The waiter falls back to `document.referrer` to extract that single id
  // when Chatwoot's URL template substitution and postMessage handshake
  // both fail.
  if (!validConversationId) {
    return <DashboardAppContextWaiter />;
  }

  // ----- Prefill from Chatwoot (server-side; admin token never crosses the wire).
  let contact: ChatwootContact | null = null;
  const cfg = loadChatwootConfig();
  if (cfg) {
    // If contact_id wasn't in the URL, derive it from the conversation.
    if (!validContactId) {
      const conv = await fetchConversation(cfg, conversationId, 5_000);
      if (conv.ok && typeof conv.data.contactId === 'number') {
        contactId = conv.data.contactId;
      }
    }
    if (Number.isFinite(contactId) && contactId > 0) {
      const r = await fetchContact(cfg, contactId, 5_000);
      if (r.ok) contact = r.data;
    }
  }

  // The agent API requires a positive integer contactId for the Chatwoot
  // confirmation message + custom-attribute write-back. If we couldn't
  // derive one (Chatwoot down, conversation missing sender, etc.), fall
  // back to the waiter so the agent isn't trapped on an unsubmittable form.
  if (!Number.isFinite(contactId) || contactId <= 0) {
    return <DashboardAppContextWaiter />;
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
