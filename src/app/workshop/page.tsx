import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaWhatsapp,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCheck,
} from 'react-icons/fa';
import { WORKSHOP_PHOTOS } from '@/lib/workshop-photos';

export const metadata: Metadata = {
  title: 'The Workshop. MBR Auto Services, Al Quoz Industrial 4.',
  description:
    'Inside the MBR workshop in Dubai. The bays, the tooling, the diagnostic platforms, the procedures. A look at where Ferrari, Lamborghini and Rolls-Royce owners leave their cars.',
  alternates: { canonical: '/workshop' },
  openGraph: {
    title: 'The MBR Workshop',
    description:
      'The bays, the tooling, the platforms, and the daily craft. Al Quoz Industrial 4.',
    type: 'website',
  },
};

const FACILITIES = [
  'Four-post lifts rated for ultra-luxury weight',
  'Low-clearance bays for supercars',
  'Climate-controlled intake and inspection area',
  'Colour-corrected bay lighting for paint and trim work',
  'Bosch diagnostic terminals on every bay',
  'Leonardo exotic-car diagnostic platform',
  'Genuine OEM parts inventory, barcoded',
  'Photographic record of every job in AutoRepairCloud',
  'Secured indoor parking during multi-day service',
  'Customer lounge with live progress updates',
];

const PROCESS = [
  {
    n: '01',
    title: 'Intake & inspection',
    body:
      'Vehicle and ownership documents recorded. Visual walk-around with photographs. Customer notes captured verbatim. Job logged in ARC before the bonnet opens.',
  },
  {
    n: '02',
    title: 'Diagnosis',
    body:
      'Bosch or Leonardo platform reads fault codes and live data. Root cause isolated before parts are ordered. No swap-til-fixed.',
  },
  {
    n: '03',
    title: 'Quotation & approval',
    body:
      'Itemised quote covering labour, parts, consumables. Sent to the owner for written approval. No work proceeds without sign-off.',
  },
  {
    n: '04',
    title: 'Work performed',
    body:
      'OEM parts, factory torque specs, original service procedures. Technician notes captured. Photographs taken at key steps. Progress visible in real time.',
  },
  {
    n: '05',
    title: 'Quality control',
    body:
      'Workshop manager reviews the job before keys go back. Test drive where appropriate. Diagnostic scan post-work to confirm no new faults introduced.',
  },
  {
    n: '06',
    title: 'Handover',
    body:
      'Itemised invoice. Photographs of work performed. Service record updated. Next-service interval noted. Keys back, no surprises.',
  },
];

export default function WorkshopPage() {
  return (
    <main className="bg-black text-white">
      {/* Editorial hero */}
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
          <p className="text-eyebrow mb-5">The Workshop</p>
          <h1 className="font-display font-light text-white leading-[1.05] tracking-[-0.025em] text-[clamp(2.25rem,5vw,4.25rem)] mb-7">
            Where the cars spend the afternoon.
          </h1>
          <p className="text-subheading text-[var(--text-body)] leading-relaxed max-w-2xl mx-auto">
            Al Quoz Industrial 4. Purpose-built bays. Dealer-level tooling.
            The space and the procedures every car goes through, in detail.
          </p>
        </div>
      </section>

      {/* Hero photograph */}
      <section className="relative">
        <div className="container-luxury max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <div className="relative aspect-[16/9]">
              <Image
                src="/images/hero-poster.jpg"
                alt="MBR workshop floor, Al Quoz Industrial 4, Dubai"
                fill
                sizes="(min-width: 1024px) 1200px, 100vw"
                priority
                className="object-cover"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)',
                }}
              />
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 right-6 md:right-8 flex items-end justify-between">
                <div>
                  <p className="text-eyebrow text-[var(--accent-bronze)] mb-1">
                    Al Quoz Industrial 4
                  </p>
                  <p className="font-display text-white text-2xl md:text-3xl font-light tracking-tight">
                    Dubai, UAE
                  </p>
                </div>
                <a
                  href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-2 text-eyebrow text-white border-b border-[var(--accent-bronze)] pb-1 hover:text-[var(--accent-bronze)] transition-colors"
                >
                  <FaMapMarkerAlt className="w-3 h-3" />
                  <span>Directions →</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities checklist */}
      <section className="relative py-20 md:py-28">
        <div className="container-luxury max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-eyebrow mb-4">The space</p>
            <div
              className="h-px w-16 mx-auto mb-7"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--accent-bronze) 30%, var(--primary) 50%, var(--accent-bronze) 70%, transparent 100%)',
              }}
              aria-hidden="true"
            />
            <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-tight tracking-[-0.02em] max-w-3xl mx-auto">
              Built for the cars we service.
            </h2>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10 max-w-4xl mx-auto">
            {FACILITIES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-4 text-body text-[var(--text-body)]"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(227,6,19,0.12)',
                    border: '1px solid var(--primary)',
                  }}
                  aria-hidden="true"
                >
                  <FaCheck className="w-3 h-3 text-[var(--primary)]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="relative py-20 md:py-28 bg-[var(--surface-1)] border-y border-white/5">
        <div className="container-luxury max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-eyebrow mb-4">Inside</p>
            <div
              className="h-px w-16 mx-auto mb-7"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--accent-bronze) 30%, var(--primary) 50%, var(--accent-bronze) 70%, transparent 100%)',
              }}
              aria-hidden="true"
            />
            <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-tight tracking-[-0.02em] max-w-3xl mx-auto">
              A look around.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {WORKSHOP_PHOTOS.map((photo) => (
              <figure
                key={photo.src}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-2)]"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)',
                    }}
                  />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <p className="text-eyebrow text-[var(--accent-bronze)] mb-2">
                    {photo.metadata}
                  </p>
                  <p className="font-display text-xl md:text-2xl text-white font-light leading-tight">
                    {photo.caption}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Process — six steps */}
      <section className="relative py-20 md:py-28">
        <div className="container-luxury max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-eyebrow mb-4">The process</p>
            <div
              className="h-px w-16 mx-auto mb-7"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--accent-bronze) 30%, var(--primary) 50%, var(--accent-bronze) 70%, transparent 100%)',
              }}
              aria-hidden="true"
            />
            <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-tight tracking-[-0.02em] max-w-3xl mx-auto">
              From intake to handover.
            </h2>
            <p className="mt-6 text-body text-[var(--text-body)] max-w-2xl mx-auto leading-relaxed">
              Every car goes through the same six steps. No skipping, no
              shortcuts. The discipline is the product.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROCESS.map((step) => (
              <article
                key={step.n}
                className="relative p-7 md:p-8 rounded-2xl border border-white/10 bg-[var(--surface-2)]"
              >
                <div
                  className="text-marker mb-3"
                  style={{ color: 'var(--primary)' }}
                >
                  {step.n}
                </div>
                <h3 className="font-display text-white font-light leading-[1.15] tracking-[-0.01em] mb-3" style={{ fontSize: 'clamp(1.35rem, 2vw, 1.75rem)' }}>
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-body)] leading-relaxed">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA close */}
      <section className="relative py-20 md:py-24 border-t border-white/5">
        <div className="container-luxury text-center max-w-3xl mx-auto">
          <h2 className="font-display font-light text-white text-3xl md:text-5xl leading-[1.1] tracking-[-0.02em] mb-6">
            See the workshop for yourself.
          </h2>
          <p className="text-subheading text-[var(--text-body)] mb-10">
            Walk-ins welcome during working hours. Or message ahead and
            we&rsquo;ll have a coffee waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR%2C%20I%27d%20like%20to%20stop%20by."
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
              <span>Book a slot</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
