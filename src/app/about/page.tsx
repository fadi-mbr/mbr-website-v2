import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp, FaCalendarAlt, FaInstagram } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'About MBR Auto Services. The workshop behind the cars.',
  description:
    'How MBR became Dubai\'s independent luxury and exotic-car workshop. Dr Basel Kelzia\'s story, the operating philosophy, the tooling, and the people on the floor every day.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About MBR Auto Services',
    description:
      'Independent luxury and exotic-car workshop in Al Quoz Industrial 4. The people, the philosophy, the tooling.',
    type: 'website',
  },
};

const PRINCIPLES = [
  {
    title: 'No work without approval.',
    body:
      'Every job starts with a written quotation and the owner\'s sign-off. No work is performed and no part is ordered without explicit approval. The first surprise on the invoice is the first call MBR loses.',
  },
  {
    title: 'Genuine OEM parts. Always.',
    body:
      'Engine, drivetrain, electrical and safety components come from the same supplier network that built the part originally in your car. Aftermarket substitutions are an opt-in, not a default.',
  },
  {
    title: 'Precision diagnostics. No guesswork.',
    body:
      'Faults are isolated to a single root cause before parts are ordered. The Leonardo platform reads the same data the factory technician sees. No parts cannon, no swap-til-fixed.',
  },
  {
    title: 'Full transparency.',
    body:
      'You see the diagnosis. You see the parts. You see the labour. Itemised invoice on every job. Nothing happens behind a curtain.',
  },
];

const TOOLING = [
  {
    name: 'Bosch Authorised',
    body:
      'MBR is a certified Bosch service centre. Diagnostic tools, OE-spec components, and the supplier network that builds the parts in your car. Bosch is the engineering backbone of most premium marques.',
    href: 'https://www.bosch.com/',
  },
  {
    name: 'Leonardo Exotic Platform',
    body:
      'Leonardo is the OEM-grade diagnostic platform built for Ferrari, Lamborghini, McLaren and the wider exotic lineup. The same toolchain factory technicians use, with ECU coding and bidirectional control most independent shops cannot match.',
    href: 'https://www.leonardodiagnostictool.com/',
  },
  {
    name: 'OEM-Level Toolchain',
    body:
      'Factory torque specs, original-equipment service procedures, and OE consumables. The cars that come through MBR don\'t forgive shortcuts and we don\'t take any.',
  },
];

export default function AboutPage() {
  return (
    <main className="bg-black text-white">
      {/* Editorial hero — shield + headline + sub */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(227,6,19,0.10) 0%, transparent 55%)',
          }}
        />

        <div className="relative container-luxury text-center max-w-4xl mx-auto">
          <Image
            src="/images/MBR_Logo_shield.svg"
            alt=""
            width={80}
            height={80}
            className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-8 opacity-90"
            priority
          />
          <p className="text-eyebrow mb-5">About MBR Auto Services</p>
          <h1 className="font-display font-light text-white leading-[1.05] tracking-[-0.025em] text-[clamp(2.25rem,5vw,4.25rem)] mb-7">
            The workshop behind the cars.
          </h1>
          <p className="text-subheading text-[var(--text-body)] leading-relaxed max-w-2xl mx-auto">
            An independent luxury and exotic-car workshop in Al Quoz
            Industrial 4. Founded on a single idea: dealership-grade work
            shouldn&rsquo;t require dealership lock-in.
          </p>
        </div>
      </section>

      {/* Founder story — Basel */}
      <section className="relative py-20 md:py-28">
        <div className="container-luxury grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Portrait */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-2)]">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/images/team-photos/Basel.webp"
                  alt="Dr Basel Kelzia, founder and owner, MBR Auto Services Dubai"
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)',
                  }}
                />
                <div
                  className="absolute top-5 left-5 px-3 py-1 rounded-full text-eyebrow"
                  style={{
                    background: 'rgba(165,120,66,0.18)',
                    border: '1px solid rgba(165,120,66,0.55)',
                    color: 'var(--accent-bronze)',
                  }}
                >
                  Founder
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="lg:col-span-7">
            <p className="text-eyebrow mb-5">The founder</p>
            <h2 className="font-display font-light text-white text-4xl md:text-5xl leading-[1.1] tracking-[-0.02em] mb-7">
              Dr Basel Kelzia
            </h2>
            <div className="space-y-5 text-body text-[var(--text-body)] leading-relaxed max-w-2xl">
              <p>
                Basel didn&rsquo;t start as a car person. He started as a
                doctor. A Doctor of Medical Science with years inside the
                pharmaceutical world. The discipline of clinical workflow
                and the engineering of how a complex system is supposed to
                behave is the lens he brought to the workshop floor.
              </p>
              <p>
                The original idea was simple. Exotic and luxury owners in
                Dubai had two choices: pay dealer prices on a dealer
                schedule, or accept the risks of an independent shop with
                neither the tools nor the discipline to work on these cars
                properly. There was no obvious third option.
              </p>
              <p>
                MBR is the third option. Workshop-grade tooling, OEM parts
                only, the same diagnostic platforms the dealers run. But
                run by people who answer to the owner, not to a sales
                quota. Basel is on the floor most days. Every Ferrari,
                Lamborghini and Rolls-Royce that comes in gets a personal
                check before it leaves.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="https://www.instagram.com/dr.abu.adam/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-eyebrow text-[var(--text-muted)] hover:text-[var(--accent-bronze)] transition-colors"
                aria-label="Basel Kelzia on Instagram"
              >
                <FaInstagram className="w-3.5 h-3.5" />
                <span>@dr.abu.adam</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop manager — Michael, mirrored layout */}
      <section className="relative py-20 md:py-28 bg-[var(--surface-1)] border-y border-white/5">
        <div className="container-luxury grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Body (left on desktop) */}
          <div className="lg:col-span-7 lg:order-1 order-2">
            <p className="text-eyebrow mb-5">On the floor</p>
            <h2 className="font-display font-light text-white text-4xl md:text-5xl leading-[1.1] tracking-[-0.02em] mb-7">
              Michael Touma
            </h2>
            <div className="space-y-5 text-body text-[var(--text-body)] leading-relaxed max-w-2xl">
              <p>
                Michael runs the bays day-to-day. Intake, work order, parts
                orchestration, technician assignment, final QC before the
                keys go back. The constant face every returning owner deals
                with.
              </p>
              <p>
                If you call MBR mid-job and ask for an update, you&rsquo;re
                most likely talking to Michael. If you walk into the
                workshop unannounced, you&rsquo;re most likely greeted by
                Michael. The operational consistency of MBR runs through
                this one person.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="https://www.instagram.com/michael_touma/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-eyebrow text-[var(--text-muted)] hover:text-[var(--accent-bronze)] transition-colors"
                aria-label="Michael Touma on Instagram"
              >
                <FaInstagram className="w-3.5 h-3.5" />
                <span>@michael_touma</span>
              </a>
            </div>
          </div>

          {/* Portrait (right on desktop) */}
          <div className="lg:col-span-5 lg:order-2 order-1">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-2)]">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/images/team-photos/Michael.webp"
                  alt="Michael Touma, workshop manager, MBR Auto Services Dubai"
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operating philosophy — four principles */}
      <section className="relative py-20 md:py-28">
        <div className="container-luxury max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-eyebrow mb-4">Operating philosophy</p>
            <div
              className="h-px w-16 mx-auto mb-7"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--accent-bronze) 30%, var(--primary) 50%, var(--accent-bronze) 70%, transparent 100%)',
              }}
              aria-hidden="true"
            />
            <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-tight tracking-[-0.02em] max-w-3xl mx-auto">
              Four rules. They cover almost everything.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {PRINCIPLES.map((p, i) => (
              <article
                key={p.title}
                className="relative p-8 md:p-10 rounded-2xl border border-white/10 bg-[var(--surface-2)] hover:border-[var(--accent-bronze)]/40 transition-colors duration-300"
              >
                <div
                  className="text-marker mb-4"
                  style={{ color: 'var(--primary)' }}
                >
                  0{i + 1}
                </div>
                <h3 className="font-display text-white font-light leading-[1.15] tracking-[-0.01em] mb-4" style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2rem)' }}>
                  {p.title}
                </h3>
                <p className="text-body text-[var(--text-body)] leading-relaxed">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Tooling deep dive */}
      <section className="relative py-20 md:py-28 bg-[var(--surface-1)] border-t border-white/5">
        <div className="container-luxury max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-eyebrow mb-4">Tooling</p>
            <div
              className="h-px w-16 mx-auto mb-7"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--accent-bronze) 30%, var(--primary) 50%, var(--accent-bronze) 70%, transparent 100%)',
              }}
              aria-hidden="true"
            />
            <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-tight tracking-[-0.02em] max-w-3xl mx-auto">
              The same instruments the dealers run.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TOOLING.map((t) => {
              const Inner = (
                <article
                  className="h-full p-8 md:p-9 rounded-2xl border transition-all duration-300 hover:border-[var(--accent-bronze)]"
                  style={{
                    borderColor: 'rgba(165,120,66,0.28)',
                    background:
                      'linear-gradient(180deg, rgba(165,120,66,0.08) 0%, rgba(165,120,66,0.02) 60%, var(--surface-2) 100%)',
                  }}
                >
                  <h3 className="font-display text-2xl text-white font-light leading-tight tracking-[-0.01em] mb-4">
                    {t.name}
                  </h3>
                  <p className="text-sm text-[var(--text-body)] leading-relaxed">
                    {t.body}
                  </p>
                  {t.href && (
                    <p className="mt-5 text-eyebrow text-[var(--accent-bronze)]">
                      Learn more →
                    </p>
                  )}
                </article>
              );
              return t.href ? (
                <a
                  key={t.name}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  aria-label={`${t.name}, external link`}
                >
                  {Inner}
                </a>
              ) : (
                <div key={t.name}>{Inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The space — Al Quoz Industrial 4 */}
      <section className="relative py-20 md:py-28">
        <div className="container-luxury max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/hero-poster.jpg"
                alt="MBR workshop interior. Al Quoz Industrial 4, Dubai."
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%), radial-gradient(circle at 100% 100%, rgba(227,6,19,0.18) 0%, transparent 50%)',
                }}
              />
            </div>
          </div>

          <div>
            <p className="text-eyebrow mb-5">The space</p>
            <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-[1.1] tracking-[-0.02em] mb-7">
              Al Quoz Industrial 4. Purpose-built bays.
            </h2>
            <div className="space-y-5 text-body text-[var(--text-body)] leading-relaxed max-w-xl">
              <p>
                MBR sits in Al Quoz Industrial 4, the established workshop
                cluster where Dubai&rsquo;s exotic-car community already
                gathers. The bays are purpose-built for low-clearance
                supercars, equipped with four-post lifts rated for the
                heaviest ultra-luxury marques.
              </p>
              <p>
                The intake area is climate-controlled. Bay lighting is
                colour-corrected so a Ferrari&rsquo;s paint reads the same
                during diagnosis as it does in daylight. Parts inventory
                runs on barcoded tracking. Every job is logged in
                AutoRepairCloud with a full photographic record.
              </p>
            </div>

            <a
              href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-eyebrow text-white border-b border-[var(--accent-bronze)] pb-1 hover:text-[var(--accent-bronze)] transition-colors"
            >
              Get directions →
            </a>
          </div>
        </div>
      </section>

      {/* CTA close */}
      <section className="relative py-20 md:py-24 border-t border-white/5">
        <div className="container-luxury text-center max-w-3xl mx-auto">
          <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-[1.1] tracking-[-0.02em] mb-6">
            Bring the car in.
          </h2>
          <p className="text-subheading text-[var(--text-body)] mb-10">
            Quick chat to confirm a slot. Or book a time directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR%2C%20I%27d%20like%20to%20book%20a%20service."
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-btn liquid-glass-btn-primary inline-flex items-center justify-center gap-3"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>Chat with us</span>
            </a>
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm tracking-wide text-[var(--text-body)] hover:text-white border border-[var(--accent-bronze)]/40 hover:border-[var(--accent-bronze)] hover:bg-[var(--accent-bronze)]/10 transition-all duration-300"
            >
              <FaCalendarAlt className="w-3.5 h-3.5" />
              <span>Book directly</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
