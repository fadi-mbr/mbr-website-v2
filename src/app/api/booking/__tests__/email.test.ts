/**
 * Unit tests for the SendGrid confirmation-email wrapper
 * (src/lib/booking-email.ts).
 *
 * We inject a fake mailer via `_setMailerForTests` rather than mocking
 * `@sendgrid/mail` directly — the upstream library's `sgMail` default export
 * is a singleton that's awkward to stub through module rewrites.
 */

import {
  _setMailerForTests,
  _resetMailerForTests,
  CONFIRMATION_SUBJECT,
  escapeHtml,
  formatDubai,
  sendConfirmationEmail,
  renderConfirmationHtml,
  type MailerLike,
} from "@/lib/booking-email";
import { assert, assertEqual, runSuite } from "./_harness";

interface CapturedSend {
  apiKey?: string;
  msg?: Record<string, unknown>;
}

function makeFakeMailer(opts: { throwOnSend?: boolean } = {}): {
  mailer: MailerLike;
  captured: CapturedSend;
} {
  const captured: CapturedSend = {};
  const mailer: MailerLike = {
    setApiKey(k: string): void {
      captured.apiKey = k;
    },
    async send(msg: Record<string, unknown>): Promise<unknown> {
      captured.msg = msg;
      if (opts.throwOnSend) throw new Error("sendgrid_boom");
      return [{ statusCode: 202 }, {}];
    },
  };
  return { mailer, captured };
}

const BASE_INPUT = {
  apiKey: "SG.test_key_xxx",
  fromEmail: "bookings@m.mbrme.com",
  to: "customer@example.com",
  firstName: "Fadi",
  serviceName: "Oil change",
  requestedAt: 1_700_000_000_000,
  confirmUrl: "https://mbrme.com/book/confirm?token=abc.def",
};

export default () =>
  runSuite("booking-email", [
    {
      name: "escapeHtml — escapes <, >, &, quotes, apostrophe",
      fn: () => {
        assertEqual(
          escapeHtml(`<script>alert("xss")</script> & 'tick'`),
          "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;tick&#39;",
        );
      },
    },
    {
      name: "formatDubai — produces a non-empty string for a valid timestamp",
      fn: () => {
        const out = formatDubai(1_700_000_000_000);
        assert(out.length > 0);
        assert(!out.includes("NaN"), "should not contain NaN");
      },
    },
    {
      name: "sendConfirmationEmail — sets apiKey + builds msg with expected fields",
      fn: async () => {
        const { mailer, captured } = makeFakeMailer();
        _setMailerForTests(mailer);
        try {
          const r = await sendConfirmationEmail(BASE_INPUT);
          assert(r.ok, "send should succeed");
          assertEqual(captured.apiKey, "SG.test_key_xxx");
          assert(captured.msg, "msg should be captured");
          assertEqual(captured.msg!.to, "customer@example.com");
          assertEqual(captured.msg!.from, "bookings@m.mbrme.com");
          assertEqual(captured.msg!.replyTo, "bookings@m.mbrme.com");
          assertEqual(captured.msg!.subject, CONFIRMATION_SUBJECT);
          assert(
            typeof captured.msg!.html === "string" && (captured.msg!.html as string).length > 0,
            "html body must be present",
          );
          assert(
            typeof captured.msg!.text === "string" && (captured.msg!.text as string).length > 0,
            "plaintext alt must be present",
          );
        } finally {
          _resetMailerForTests();
        }
      },
    },
    {
      name: "sendConfirmationEmail — HTML escapes firstName & serviceName",
      fn: async () => {
        const { mailer, captured } = makeFakeMailer();
        _setMailerForTests(mailer);
        try {
          await sendConfirmationEmail({
            ...BASE_INPUT,
            firstName: "<script>",
            serviceName: "Oil & lube",
          });
          const html = captured.msg!.html as string;
          assert(html.includes("&lt;script&gt;"), "firstName must be escaped");
          assert(
            html.includes("Oil &amp; lube"),
            "serviceName ampersand must be escaped",
          );
          assert(
            !html.includes("<script>"),
            "raw <script> must not appear in html",
          );
        } finally {
          _resetMailerForTests();
        }
      },
    },
    {
      name: "sendConfirmationEmail — returns ok:false on send failure",
      fn: async () => {
        const { mailer } = makeFakeMailer({ throwOnSend: true });
        _setMailerForTests(mailer);
        try {
          const r = await sendConfirmationEmail(BASE_INPUT);
          assert(!r.ok);
          if (!r.ok) {
            assert(
              (r.error || "").includes("sendgrid_boom"),
              "error message should propagate, got: " + r.error,
            );
          }
        } finally {
          _resetMailerForTests();
        }
      },
    },
    {
      name: "sendConfirmationEmail — fails fast on missing required fields",
      fn: async () => {
        const r1 = await sendConfirmationEmail({ ...BASE_INPUT, apiKey: "" });
        assert(!r1.ok);
        const r2 = await sendConfirmationEmail({ ...BASE_INPUT, fromEmail: "" });
        assert(!r2.ok);
        const r3 = await sendConfirmationEmail({ ...BASE_INPUT, to: "" });
        assert(!r3.ok);
      },
    },
    {
      name: "renderConfirmationHtml — includes confirm URL + button + footer",
      fn: () => {
        const html = renderConfirmationHtml({
          firstName: "Fadi",
          serviceName: "Oil change",
          requestedAt: 1_700_000_000_000,
          confirmUrl: "https://mbrme.com/book/confirm?token=abc",
        });
        assert(html.includes("https://mbrme.com/book/confirm?token=abc"));
        assert(html.toLowerCase().includes("confirm booking"));
        assert(html.includes("MBR Auto Services"));
        assert(html.includes("max-width:560px"));
      },
    },
  ]);
