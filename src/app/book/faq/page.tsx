"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FaWhatsapp, FaPhone } from 'react-icons/fa';

// NOTE: This page is a Client Component (it owns the EN/AR language toggle
// state). Route metadata (title, description, robots: index) is exported
// from the sibling `layout.tsx` so the App Router can pick it up while
// keeping the interactive surface client-side.

type Lang = 'en' | 'ar';

const STRINGS = {
  eyebrow: { en: 'Booking — FAQ', ar: 'الحجز — الأسئلة الشائعة' },
  heading: { en: 'Booking, in plain English.', ar: 'الحجز ببساطة.' },
  intro: {
    en: 'Everything you need to know about booking a service at MBR — how it works, what to expect, and how to reach us if anything changes.',
    ar: 'كل ما تحتاج معرفته لحجز خدمة لدى MBR — كيف يعمل النظام، وماذا تتوقع، وكيفية الوصول إلينا إذا تغيّر شيء ما.',
  },
  toggleEn: 'English',
  toggleAr: 'العربية',
  ctaChat: { en: 'Chat to book', ar: 'احجز عبر المحادثة' },
  ctaCall: { en: 'Call +971 56 501 5800', ar: 'اتصل على +971 56 501 5800' },
  stillStuck: {
    en: "Still not sure? Message us — we usually reply within minutes during working hours.",
    ar: 'ما زلت غير متأكد؟ راسلنا — عادةً نردّ خلال دقائق ضمن ساعات العمل.',
  },
  backToBook: { en: '← Back to booking', ar: '→ العودة إلى الحجز' },
} as const;

interface QA {
  q: { en: string; ar: string };
  a: { en: React.ReactNode; ar: React.ReactNode };
}

const QAS: QA[] = [
  {
    q: {
      en: 'How do I book online?',
      ar: 'كيف أحجز عبر الإنترنت؟',
    },
    a: {
      en: (
        <>
          <p>Five quick steps. The whole flow takes about a minute.</p>
          <ol className="faq-ol">
            <li>Pick a service from the list (e.g. Vehicle Inspection Report).</li>
            <li>Pick a date in the next 14 days.</li>
            <li>Pick a time slot that works for you.</li>
            <li>Fill your name, phone, email, and a quick note about the car.</li>
            <li>Confirm. You&apos;ll see a success screen and get an email shortly after.</li>
          </ol>
          <p>No card, no payment, no account — just the slot.</p>
        </>
      ),
      ar: (
        <>
          <p>خمس خطوات سريعة. تستغرق العملية كلها حوالي دقيقة.</p>
          <ol className="faq-ol">
            <li>اختر خدمة من القائمة (مثل تقرير فحص المركبة).</li>
            <li>اختر تاريخًا خلال الأيام الـ14 القادمة.</li>
            <li>اختر الوقت المناسب لك.</li>
            <li>أدخل اسمك، رقم هاتفك، بريدك الإلكتروني، وملاحظة سريعة عن السيارة.</li>
            <li>أكّد الحجز. ستظهر شاشة نجاح ويصلك بريد إلكتروني بعدها بقليل.</li>
          </ol>
          <p>بدون بطاقة، بدون دفع، بدون حساب — فقط الموعد.</p>
        </>
      ),
    },
  },
  {
    q: {
      en: 'What services can I book?',
      ar: 'ما الخدمات المتاحة للحجز؟',
    },
    a: {
      en: (
        <>
          <p>The current list:</p>
          <ul className="faq-ul">
            <li>Vehicle Inspection Report</li>
            <li>Computerized Diagnosis</li>
            <li>Wheel Alignment</li>
            <li>AC Inspection</li>
            <li>Engine Inspection</li>
            <li>Suspension Inspection</li>
          </ul>
          <p>Pricing is shown next to each service inside the booking flow so you see the number before you commit.</p>
        </>
      ),
      ar: (
        <>
          <p>القائمة الحالية:</p>
          <ul className="faq-ul">
            <li>تقرير فحص المركبة</li>
            <li>التشخيص الإلكتروني</li>
            <li>ضبط زوايا العجلات</li>
            <li>فحص نظام التكييف</li>
            <li>فحص المحرك</li>
            <li>فحص نظام التعليق</li>
          </ul>
          <p>يظهر السعر بجانب كل خدمة داخل نموذج الحجز حتى ترى الرقم قبل التأكيد.</p>
        </>
      ),
    },
  },
  {
    q: {
      en: 'Do I need to pay online?',
      ar: 'هل يجب الدفع عبر الإنترنت؟',
    },
    a: {
      en: (
        <p>
          No. Payment happens at the shop when the work is done. The online booking is just for the time slot —
          we do not capture card details.
        </p>
      ),
      ar: (
        <p>
          لا. الدفع يتم في الورشة بعد انتهاء العمل. الحجز عبر الإنترنت لتأكيد الموعد فقط — لا نطلب بيانات البطاقة.
        </p>
      ),
    },
  },
  {
    q: {
      en: 'How will I know my booking is confirmed?',
      ar: 'كيف أعرف أنّ الحجز تأكّد؟',
    },
    a: {
      en: (
        <>
          <p>
            You&apos;ll see a confirmation screen immediately, and an email lands in your inbox within a minute or
            two. The day before your appointment we&apos;ll send a reminder.
          </p>
          <p>
            A WhatsApp confirmation is coming soon — for now, the email is the official confirmation. If you&apos;d
            prefer a WhatsApp note straight away, message us at <strong>+971 56 501 5800</strong> after booking
            and we&apos;ll reply.
          </p>
        </>
      ),
      ar: (
        <>
          <p>
            سترى شاشة تأكيد فورًا، ويصلك بريد إلكتروني خلال دقيقة أو دقيقتين. وفي اليوم السابق للموعد سنرسل لك
            تذكيرًا.
          </p>
          <p>
            تأكيد عبر واتساب قادم قريبًا — حاليًا البريد الإلكتروني هو التأكيد الرسمي. إذا فضّلت رسالة واتساب فورية،
            راسلنا على <strong>+971 56 501 5800</strong> بعد الحجز وسنرد عليك.
          </p>
        </>
      ),
    },
  },
  {
    q: {
      en: 'How do I reschedule or cancel?',
      ar: 'كيف أؤجّل الموعد أو ألغيه؟',
    },
    a: {
      en: (
        <p>
          WhatsApp us at <strong>+971 56 501 5800</strong>, quote your original time, and tell us what works
          instead. We&apos;ll move it and reply when it&apos;s done. No fees, no fuss.
        </p>
      ),
      ar: (
        <p>
          راسلنا عبر واتساب على <strong>+971 56 501 5800</strong>، اذكر وقت الموعد الأصلي وأخبرنا بالوقت البديل.
          سننقل الموعد ونؤكّد لك. بدون رسوم، بدون تعقيد.
        </p>
      ),
    },
  },
  {
    q: {
      en: "What if I'm late or miss my slot?",
      ar: 'ماذا لو تأخّرت أو فاتني الموعد؟',
    },
    a: {
      en: (
        <p>
          Just WhatsApp us. We&apos;ll usually fit you in the same day during working hours. Best to message before
          you arrive so the bay is ready.
        </p>
      ),
      ar: (
        <p>
          راسلنا عبر واتساب. عادةً نستطيع استقبالك في نفس اليوم ضمن ساعات العمل. يُفضّل المراسلة قبل وصولك حتى نُجهّز
          المكان.
        </p>
      ),
    },
  },
  {
    q: {
      en: 'Can I walk in without booking?',
      ar: 'هل أستطيع الحضور دون حجز مسبق؟',
    },
    a: {
      en: (
        <p>
          Yes — walk-ins are welcome during open hours. Booking just guarantees a slot and means we&apos;re ready
          for you when you arrive.
        </p>
      ),
      ar: (
        <p>
          نعم — نرحّب بالعملاء دون موعد ضمن ساعات العمل. الحجز يضمن لك الموعد ويعني أننا جاهزون لاستقبالك عند
          وصولك.
        </p>
      ),
    },
  },
  {
    q: {
      en: 'Do you take bookings on Sundays?',
      ar: 'هل تقبلون الحجوزات يوم الأحد؟',
    },
    a: {
      en: (
        <p>
          We&apos;re closed Sundays. Booking slots are open <strong>Monday to Saturday, 08:30–19:30</strong> Dubai
          time.
        </p>
      ),
      ar: (
        <p>
          نحن مغلقون أيام الأحد. مواعيد الحجز متاحة من <strong>الإثنين إلى السبت، 08:30–19:30</strong> بتوقيت دبي.
        </p>
      ),
    },
  },
  {
    q: {
      en: "What's the difference between an inspection and a diagnostic?",
      ar: 'ما الفرق بين الفحص والتشخيص؟',
    },
    a: {
      en: (
        <>
          <p>
            An <strong>inspection</strong> is a structured checklist — visual and measurement-based. We look at
            the parts and systems, measure what we can, and give you a clear report of condition.
          </p>
          <p>
            A <strong>diagnostic</strong> is investigative. We plug into the car&apos;s computer (OBD), read live
            data and fault codes, and a technician chases down the root cause of a specific issue you&apos;re
            seeing.
          </p>
          <p>
            If you&apos;re not sure which one fits, mention what the car is doing in the description field — we&apos;ll
            guide you.
          </p>
        </>
      ),
      ar: (
        <>
          <p>
            <strong>الفحص</strong> قائمة منظّمة من الخطوات — بصرية وقياسية. نفحص الأجزاء والأنظمة، نقيس ما يمكن
            قياسه، ونزوّدك بتقرير واضح عن الحالة.
          </p>
          <p>
            <strong>التشخيص</strong> أكثر تحقيقًا. نتصل بكمبيوتر السيارة (OBD)، نقرأ البيانات الحيّة وأكواد الأعطال،
            ويتتبّع الفنّي السبب الجذري لمشكلة محدّدة تواجهها.
          </p>
          <p>إذا لم تكن متأكدًا أيّهما يناسبك، اذكر ما يحدث في خانة الوصف وسنرشدك.</p>
        </>
      ),
    },
  },
  {
    q: {
      en: 'Can I bring more than one car?',
      ar: 'هل أستطيع إحضار أكثر من سيارة؟',
    },
    a: {
      en: (
        <p>
          Book one car per slot. If you have more, mention it in the description field and we&apos;ll arrange the
          additional cars with you over WhatsApp — usually back-to-back on the same morning works best.
        </p>
      ),
      ar: (
        <p>
          احجز سيارة واحدة لكل موعد. إذا كان لديك أكثر من سيارة، اذكر ذلك في خانة الوصف وسنرتّب السيارات الإضافية
          معك عبر واتساب — عادةً يكون التتابع في نفس الصباح هو الأنسب.
        </p>
      ),
    },
  },
  {
    q: {
      en: 'How accurate are the service duration estimates?',
      ar: 'ما مدى دقّة المدد الزمنية المعروضة للخدمات؟',
    },
    a: {
      en: (
        <p>
          Honest answer: the durations shown are for time-budgeting — they help you plan your day. Actual time
          depends on what we find once we&apos;re into the car. If anything changes the picture, we WhatsApp you
          before we keep going.
        </p>
      ),
      ar: (
        <p>
          بصراحة: المدد المعروضة لتخطيط وقتك — تساعدك على تنظيم يومك. الوقت الفعلي يعتمد على ما نجده عند بدء العمل
          على السيارة. وإذا تغيّر شيء، نراسلك عبر واتساب قبل أن نكمل.
        </p>
      ),
    },
  },
  {
    q: {
      en: 'What if my car is unusual — classic, exotic, or modified?',
      ar: 'ماذا لو كانت سيارتي غير اعتيادية — كلاسيكية، سيارة فاخرة نادرة، أو معدّلة؟',
    },
    a: {
      en: (
        <p>
          Book the closest service to what you need and put the details in the description (year, build, what&apos;s
          modified, what you&apos;re trying to solve). We&apos;ll WhatsApp you before your slot to confirm scope and
          make sure the right technician is on the bay when you arrive.
        </p>
      ),
      ar: (
        <p>
          احجز الخدمة الأقرب إلى ما تحتاجه، واكتب التفاصيل في خانة الوصف (السنة، الطراز، التعديلات، المشكلة التي
          تحاول حلّها). سنراسلك عبر واتساب قبل الموعد لتأكيد النطاق والتأكّد من تواجد الفنّي المناسب عند وصولك.
        </p>
      ),
    },
  },
  {
    q: {
      en: 'Privacy — where does my data go?',
      ar: 'الخصوصية — أين تذهب بياناتي؟',
    },
    a: {
      en: (
        <>
          <p>
            The booking details (name, phone, email, vehicle info, the note you write) are stored inside our
            workshop management system, AutoRepairCloud. We use them to deliver the service, contact you about
            the appointment, and keep your service history so we know your car next time.
          </p>
          <p>
            We do not sell your data. The full details are in our{' '}
            <Link href="/privacy" className="faq-link">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ),
      ar: (
        <>
          <p>
            تفاصيل الحجز (الاسم، الهاتف، البريد، معلومات السيارة، ملاحظتك) تُحفظ في نظام إدارة الورشة لدينا
            AutoRepairCloud. نستخدمها لتقديم الخدمة، والتواصل معك بشأن الموعد، والاحتفاظ بسجل خدمات سيارتك
            للزيارات القادمة.
          </p>
          <p>
            لا نبيع بياناتك. كامل التفاصيل في{' '}
            <Link href="/privacy" className="faq-link">
              سياسة الخصوصية
            </Link>
            .
          </p>
        </>
      ),
    },
  },
];

export default function BookingFaqPage() {
  const [lang, setLang] = useState<Lang>('en');
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <main className="min-h-screen bg-black text-white" lang={lang} dir={dir}>
      <section className="section-padding">
        <div className="container-luxury max-w-4xl">
          {/* Language toggle */}
          <div className="flex justify-end mb-8">
            <div className="inline-flex rounded-full border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-4 py-1.5 text-xs uppercase tracking-[0.2em] rounded-full transition-colors ${
                  lang === 'en' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'
                }`}
                aria-pressed={lang === 'en'}
              >
                {STRINGS.toggleEn}
              </button>
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`px-4 py-1.5 text-xs uppercase tracking-[0.2em] rounded-full transition-colors ${
                  lang === 'ar' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'
                }`}
                aria-pressed={lang === 'ar'}
              >
                {STRINGS.toggleAr}
              </button>
            </div>
          </div>

          {/* Eyebrow */}
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-accent-bronze mb-5">
            {STRINGS.eyebrow[lang]}
          </p>

          {/* Headline */}
          <h1 className="text-display font-light gradient-text mb-6 leading-tight">
            {STRINGS.heading[lang]}
          </h1>

          <p className="text-subheading text-[var(--text-body)] max-w-2xl leading-relaxed mb-12">
            {STRINGS.intro[lang]}
          </p>

          {/* Accordion */}
          <div className="glass-card-premium p-6 md:p-10 space-y-4">
            {QAS.map((item, idx) => (
              <details
                key={idx}
                className="group border-b border-white/5 last:border-b-0 py-3"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 py-2 text-white">
                  <span className="text-subheading font-light leading-snug">
                    {item.q[lang]}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1 text-accent-bronze transition-transform group-open:rotate-45 text-xl leading-none flex-shrink-0"
                  >
                    +
                  </span>
                </summary>
                <div className="pt-3 pb-2 text-body text-[var(--text-body)] leading-relaxed space-y-3">
                  {item.a[lang]}
                </div>
              </details>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-12">
            <p className="text-body text-[var(--text-muted)] mb-5 leading-relaxed">
              {STRINGS.stillStuck[lang]}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR%2C%20I%20have%20a%20question%20about%20booking."
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-btn liquid-glass-btn-primary inline-flex items-center justify-center gap-3"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span>{STRINGS.ctaChat[lang]}</span>
              </a>
              <a
                href="tel:+971565015800"
                className="liquid-glass-btn liquid-glass-btn-secondary inline-flex items-center justify-center gap-3"
              >
                <FaPhone className="w-4 h-4" />
                <span>{STRINGS.ctaCall[lang]}</span>
              </a>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <Link
              href="/book"
              className="text-sm text-accent-bronze hover:text-white transition-colors"
            >
              {STRINGS.backToBook[lang]}
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal styling for accordion lists — kept inline to avoid a
          new globals.css entry for a single page. */}
      <style jsx>{`
        :global(.faq-ol) {
          list-style: decimal;
          padding-inline-start: 1.25rem;
          margin: 0.25rem 0;
        }
        :global(.faq-ul) {
          list-style: disc;
          padding-inline-start: 1.25rem;
          margin: 0.25rem 0;
        }
        :global(.faq-ol li),
        :global(.faq-ul li) {
          margin: 0.25rem 0;
        }
        :global(.faq-link) {
          color: var(--accent-bronze, #c9a961);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s;
        }
        :global(.faq-link:hover) {
          color: #fff;
        }
      `}</style>
    </main>
  );
}
