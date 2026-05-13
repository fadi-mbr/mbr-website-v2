'use client';

/**
 * Renders inside `/book/agent` when the URL didn't carry `contact_id` /
 * `conversation_id`. Chatwoot Dashboard Apps in some configurations don't
 * substitute the URL template variables — instead they post the
 * conversation context to the iframe via `window.postMessage`.
 *
 * On mount we:
 *   1. Announce ourselves to the parent (some Chatwoot versions wait for
 *      a `chatwoot-dashboard-app:ready` message before posting context).
 *   2. Listen for any incoming message whose origin matches
 *      `connect.mbrme.com` and whose payload contains a contact + a
 *      conversation id.
 *   3. When we receive it, navigate the iframe to the same path with the
 *      ids attached. The Server Component then takes over and renders the
 *      prefilled booking form via the normal flow.
 *
 * If no message arrives within 8 seconds, fall back to a manual "Open in
 * a new tab" link the advisor can paste a contact_id into.
 */

import { useEffect, useState } from 'react';

type Status =
  | { kind: 'waiting' }
  | { kind: 'received' }
  | { kind: 'timeout' };

interface ChatwootCtxLike {
  contact?: { id?: number };
  conversation?: { id?: number };
  data?: {
    contact?: { id?: number };
    conversation?: { id?: number };
    currentConversation?: { id?: number; meta?: { sender?: { id?: number } } };
  };
  currentConversation?: { id?: number; meta?: { sender?: { id?: number } } };
}

function extractIds(payload: unknown): { contactId?: number; conversationId?: number } {
  if (!payload || typeof payload !== 'object') return {};
  const p = payload as ChatwootCtxLike;
  // Many Chatwoot versions package the data differently — probe a few shapes.
  const candidates: Array<{ contactId?: number; conversationId?: number }> = [];
  if (p.contact?.id && p.conversation?.id) {
    candidates.push({ contactId: p.contact.id, conversationId: p.conversation.id });
  }
  if (p.data?.contact?.id && p.data?.conversation?.id) {
    candidates.push({
      contactId: p.data.contact.id,
      conversationId: p.data.conversation.id,
    });
  }
  if (p.data?.currentConversation?.id) {
    const c = p.data.currentConversation;
    candidates.push({
      contactId: c.meta?.sender?.id,
      conversationId: c.id,
    });
  }
  if (p.currentConversation?.id) {
    const c = p.currentConversation;
    candidates.push({
      contactId: c.meta?.sender?.id,
      conversationId: c.id,
    });
  }
  for (const c of candidates) {
    if (
      typeof c.contactId === 'number' &&
      typeof c.conversationId === 'number' &&
      c.contactId > 0 &&
      c.conversationId > 0
    ) {
      return c;
    }
  }
  return {};
}

export function DashboardAppContextWaiter(): React.ReactElement {
  const [status, setStatus] = useState<Status>({ kind: 'waiting' });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onMessage = (event: MessageEvent) => {
      // Origin allow-list — only our Chatwoot host can hand us context.
      if (event.origin !== 'https://connect.mbrme.com') return;
      // Some Chatwoot versions wrap the data as a JSON string in event.data.
      let raw: unknown = event.data;
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw);
        } catch {
          return;
        }
      }
      const { contactId, conversationId } = extractIds(raw);
      if (!contactId || !conversationId) return;
      if (cancelled) return;
      setStatus({ kind: 'received' });
      // Replace the URL — the Server Component re-renders with the IDs.
      const next = new URL(window.location.href);
      next.searchParams.set('contact_id', String(contactId));
      next.searchParams.set('conversation_id', String(conversationId));
      window.location.replace(next.toString());
    };

    window.addEventListener('message', onMessage);

    // Best-effort handshake. Chatwoot listens for app-ready events from
    // some Dashboard App integrations.
    try {
      window.parent?.postMessage(
        { event: 'chatwoot-dashboard-app:ready' },
        'https://connect.mbrme.com',
      );
      window.parent?.postMessage(
        { type: 'chatwoot:dashboard:ready' },
        'https://connect.mbrme.com',
      );
    } catch {
      // Cross-origin block — that's fine, Chatwoot may broadcast unprompted.
    }

    timer = setTimeout(() => {
      if (!cancelled) setStatus({ kind: 'timeout' });
    }, 8_000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  if (status.kind === 'received') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading conversation…</p>
      </div>
    );
  }

  if (status.kind === 'waiting') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-6 w-6 rounded-full border-2 border-[#b08d57] border-t-transparent animate-spin mb-3" aria-hidden="true" />
          <p className="text-sm text-neutral-400">Waiting for MBR Connect to send the conversation…</p>
        </div>
      </div>
    );
  }

  // Timeout fallback — advisor can paste contact_id manually if needed.
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-[640px] px-4 py-10 space-y-4">
        <h1 className="text-xl font-light">Conversation context didn’t arrive</h1>
        <p className="text-sm text-neutral-300">
          MBR Connect should pass the contact + conversation IDs to this
          page automatically. If you keep seeing this, you can still book
          on behalf by opening{' '}
          <a
            href="https://mbrme.com/book"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b08d57] underline"
          >
            mbrme.com/book
          </a>{' '}
          in a new tab and entering the customer’s details.
        </p>
        <p className="text-xs text-neutral-500">
          (Technical: this page expects <code>?contact_id=…&amp;conversation_id=…</code> in
          the URL, or a <code>postMessage</code> with the conversation
          context from <code>connect.mbrme.com</code>. Neither arrived within 8 seconds.)
        </p>
      </main>
    </div>
  );
}
