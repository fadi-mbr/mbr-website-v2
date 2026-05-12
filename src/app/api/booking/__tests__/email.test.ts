/**
 * Unit tests for the nodemailer/SMTP confirmation-email wrapper
 * (src/lib/booking-email.ts).
 *
 * We inject a fake transporter via `_setMailerForTests` rather than mocking
 * `nodemailer` directly — `nodemailer.createTransport()` returns a stateful
 * transporter object that is awkward to stub through module rewrites.
 */

import {
  _setMailerForTests,
  _resetMailerForTests,
  CONFIRMATION_SUBJECT,
  escapeHtml,
  formatDubai,
  sendConfirmationEmail,
  renderConfirmationHtml,
  type TransporterLike,
} from "@/lib/booking-email";
import { assert, assertEqual, runSuite } from "./_harness";

interface CapturedSend {
  msg?: Record<string, unknown>;
}

function makeFakeTransporter(opts: { throwOnSend?: boolean } = {}): {
  transporter: TransporterLike;
  captured: CapturedSend;
} {
  const captured: CapturedSend = {};
  const transporter: TransporterLike = {
    async sendMail(msg: Record<string, unknown>): Promise<unknown> {
      captured.msg = msg;
      if (opts.throwOnSend) throw new Error("smtp_boom");
      return { messageId: "<test@local>", accepted: [msg.to] };
    },
  };
  return { transporter, captured };
}

const BASE_INPUT = {
  smtp: {
    host: "smtp.improvmx.com",
    port: 587,
    user: "booking@mail.mbrme.com",
    password: "test-password",
  },
  fromEmail: "booking@mail.mbrme.com",
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
      name: "formatDubai — accepts a Date object",
      fn: () => {
        const out = formatDubai(new Date(1_700_000_000_000));
        assert(out.length > 0);
        assert(!out.includes("NaN"));
      },
    },
    {
      name: "sendConfirmationEmail — builds msg with expected fields",
      fn: async () => {
        const { transporter, captured } = makeFakeTransporter();
        _setMailerForTests(transporter);
        try {
          const r = await sendConfirmationEmail(BASE_INPUT);
          assert(r.ok, "send should succeed");
          assert(captured.msg, "msg should be captured");
          assertEqual(captured.msg!.to, "customer@example.com");
          assertEqual(captured.msg!.from, "booking@mail.mbrme.com");
          assertEqual(captured.msg!.replyTo, "booking@mail.mbrme.com");
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
        const { transporter, captured } = makeFakeTransporter();
        _setMailerForTests(transporter);
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
      name: "sendConfirmationEmail — plaintext fallback URL on its own line",
      fn: async () => {
        const { transporter, captured } = makeFakeTransporter();
        _setMailerForTests(transporter);
        try {
          await sendConfirmationEmail(BASE_INPUT);
          const text = captured.msg!.text as string;
          const lines = text.split("\n");
          assert(
            lines.includes(BASE_INPUT.confirmUrl),
            "confirm URL must appear on its own line in plaintext",
          );
        } finally {
          _resetMailerForTests();
        }
      },
    },
    {
      name: "sendConfirmationEmail — returns ok:false on send failure",
      fn: async () => {
        const { transporter } = makeFakeTransporter({ throwOnSend: true });
        _setMailerForTests(transporter);
        try {
          const r = await sendConfirmationEmail(BASE_INPUT);
          assert(!r.ok);
          if (!r.ok) {
            assert(
              (r.error || "").includes("smtp_boom"),
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
        const r1 = await sendConfirmationEmail({
          ...BASE_INPUT,
          smtp: { ...BASE_INPUT.smtp, host: "" },
        });
        assert(!r1.ok);
        const r2 = await sendConfirmationEmail({
          ...BASE_INPUT,
          smtp: { ...BASE_INPUT.smtp, user: "" },
        });
        assert(!r2.ok);
        const r3 = await sendConfirmationEmail({
          ...BASE_INPUT,
          smtp: { ...BASE_INPUT.smtp, password: "" },
        });
        assert(!r3.ok);
        const r4 = await sendConfirmationEmail({ ...BASE_INPUT, fromEmail: "" });
        assert(!r4.ok);
        const r5 = await sendConfirmationEmail({ ...BASE_INPUT, to: "" });
        assert(!r5.ok);
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
