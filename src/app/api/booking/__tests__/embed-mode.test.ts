/**
 * Tests for src/lib/embed-mode.ts — URL param prefill and embed-flag detection.
 *
 * The postMessage path is not unit-tested here (it needs a DOM); the URL
 * helpers are pure and that's where the load-bearing parsing lives.
 */

import { isEmbedMode, readContextFromUrl } from '../../../../lib/embed-mode';
import { runSuite, assertEqual, assert } from './_harness';

export default function suite() {
  return runSuite('embed-mode (URL helpers)', [
    {
      name: 'isEmbedMode returns true for ?embed=1',
      fn: () => {
        assertEqual(isEmbedMode('embed=1'), true);
      },
    },
    {
      name: 'isEmbedMode returns true for ?embed=true',
      fn: () => {
        assertEqual(isEmbedMode('embed=true'), true);
      },
    },
    {
      name: 'isEmbedMode returns false for ?embed=0',
      fn: () => {
        assertEqual(isEmbedMode('embed=0'), false);
      },
    },
    {
      name: 'isEmbedMode returns false when param absent',
      fn: () => {
        assertEqual(isEmbedMode('phone=971501234567'), false);
      },
    },

    {
      name: 'readContextFromUrl returns {} for empty search',
      fn: () => {
        assertEqual(readContextFromUrl(''), {});
      },
    },
    {
      name: 'readContextFromUrl extracts phone (UAE format)',
      fn: () => {
        assertEqual(
          readContextFromUrl('phone=971501234567'),
          { phone: '971501234567' }
        );
      },
    },
    {
      name: 'readContextFromUrl strips leading + from phone',
      fn: () => {
        assertEqual(
          readContextFromUrl('phone=%2B971501234567'),
          { phone: '971501234567' }
        );
      },
    },
    {
      name: 'readContextFromUrl rejects non-digit phone',
      fn: () => {
        assertEqual(readContextFromUrl('phone=abc123'), {});
      },
    },
    {
      name: 'readContextFromUrl extracts URL-encoded name',
      fn: () => {
        assertEqual(
          readContextFromUrl('name=Faisal%20Al%20Maktoum'),
          { name: 'Faisal Al Maktoum' }
        );
      },
    },
    {
      name: 'readContextFromUrl extracts valid email',
      fn: () => {
        assertEqual(
          readContextFromUrl('email=user%40example.com'),
          { email: 'user@example.com' }
        );
      },
    },
    {
      name: 'readContextFromUrl rejects malformed email',
      fn: () => {
        assertEqual(readContextFromUrl('email=not-an-email'), {});
      },
    },
    {
      name: 'readContextFromUrl parses conversation_id as integer',
      fn: () => {
        assertEqual(
          readContextFromUrl('conversation_id=42'),
          { conversationId: 42 }
        );
      },
    },
    {
      name: 'readContextFromUrl ignores non-numeric conversation_id',
      fn: () => {
        assertEqual(readContextFromUrl('conversation_id=abc'), {});
      },
    },
    {
      name: 'readContextFromUrl extracts all fields together',
      fn: () => {
        const ctx = readContextFromUrl(
          'phone=971501234567&name=Faisal&email=f%40x.com&conversation_id=7&channel=whatsapp'
        );
        assertEqual(ctx.phone, '971501234567');
        assertEqual(ctx.name, 'Faisal');
        assertEqual(ctx.email, 'f@x.com');
        assertEqual(ctx.conversationId, 7);
        assertEqual(ctx.channel, 'whatsapp');
      },
    },
    {
      name: 'readContextFromUrl truncates suspiciously long name',
      fn: () => {
        const long = 'A'.repeat(200);
        const ctx = readContextFromUrl(`name=${long}`);
        assert(ctx.name !== undefined);
        assert((ctx.name as string).length <= 80, 'name capped at 80');
      },
    },
  ]);
}
