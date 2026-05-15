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

/**
 * Try to recover the conversation id from `document.referrer`. The parent
 * page that loads the iframe is the Chatwoot conversation view at
 * `https://connect.mbrme.com/app/accounts/<n>/inbox/<n>/conversations/<id>`,
 * so the conversation id is reliably present in the path even when the
 * dashboard-app handshake fails.
 *
 * Returns the conversation id as a number, or `null` if none is found
 * (referrer empty, different origin, malformed path).
 */
function extractConversationIdFromReferrer(): number | null {
  if (typeof document === 'undefined') return null;
  const ref = document.referrer;
  if (!ref) return null;
  let u: URL;
  try {
    u = new URL(ref);
  } catch {
    return null;
  }
  if (u.origin !== 'https://connect.mbrme.com') return null;
  const m = /\/conversations\/(\d+)/.exec(u.pathname);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function DashboardAppContextWaiter(): React.ReactElement {
  const [status, setStatus] = useState<Status>({ kind: 'waiting' });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Fast path: the parent URL almost always contains /conversations/<id>.
    // The server page accepts conversation_id alone and derives contact_id
    // from Chatwoot's conversation envelope — no postMessage handshake
    // required. This makes the iframe resilient to parent-frame races
    // (e.g. when Chatwoot re-renders the contact pane after a save).
    const referrerConvId = extractConversationIdFromReferrer();
    if (referrerConvId) {
      setStatus({ kind: 'received' });
      const next = new URL(window.location.href);
      next.searchParams.set('conversation_id', String(referrerConvId));
      window.location.replace(next.toString());
      return () => {};
    }

    const onMessage = (event: MessageEvent) => {
      // Origin allow-list — only our Chatwoot host can hand us context.
      if (event.origin !== 'https://connect.mbrme.com') return;
      // Chatwoot sends the response as a JSON string in event.data.
      // The string shape is: '{"event":"appContext","data":{...}}'
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

    // Chatwoot Dashboard App handshake: post a JSON-stringified message to
    // the parent frame requesting the conversation context. Chatwoot
    // replies with `{event:'appContext', data:{contact, conversation, currentAgent}}`
    // which our `onMessage` listener picks up.
    //
    // The event name is the official one (chatwoot-dashboard-app:fetch-info).
    // We also retry a few times since some Chatwoot v4 builds drop the first
    // request if it arrives before the parent has wired its message listener.
    const requestContext = () => {
      try {
        window.parent?.postMessage(
          JSON.stringify({ event: 'chatwoot-dashboard-app:fetch-info' }),
          'https://connect.mbrme.com',
        );
        // Some Chatwoot helper packages also accept '*' targetOrigin;
        // re-send with wildcard as a safety net.
        window.parent?.postMessage(
          JSON.stringify({ event: 'chatwoot-dashboard-app:fetch-info' }),
          '*',
        );
      } catch {
        // Cross-origin block — that's fine, the listener may still receive.
      }
    };
    requestContext();
    // Retry at 250ms, 1s, 3s. Chatwoot v4 has been observed to occasionally
    // miss the first ping; subsequent ones usually succeed.
    const retry1 = setTimeout(requestContext, 250);
    const retry2 = setTimeout(requestContext, 1000);
    const retry3 = setTimeout(requestContext, 3000);

    timer = setTimeout(() => {
      if (!cancelled) setStatus({ kind: 'timeout' });
    }, 8_000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      clearTimeout(retry1);
      clearTimeout(retry2);
      clearTimeout(retry3);
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
          <div className="inline-block h-6 w-6 rounded-full border-2 border-[#E30613] border-t-transparent animate-spin mb-3" aria-hidden="true" />
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
            className="text-[#E30613] underline"
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
