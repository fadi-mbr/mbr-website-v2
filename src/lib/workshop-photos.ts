/**
 * Workshop gallery manifest — single source of truth for what renders in
 * <OurWorkshop />. To swap photos, drop new files under
 * `public/images/workshop/` and update this array.
 *
 * Each entry now carries editorial metadata (`metadata`) — a short
 * 911Porsche-styled tag rendered under the caption — and optionally a
 * single-line `story` revealed on hover. Phase B's editorial direction
 * wants each tile to *say* something, not just look good.
 *
 * `featured: true` makes a tile span 2 columns on desktop. Only one
 * featured tile is sensible.
 *
 * Until dedicated workshop photography lands, this manifest reuses the
 * existing service-themed images plus the hero poster.
 */

export type WorkshopPhoto = {
  /** Path under /public, served as /[src]. */
  src: string;
  /** Alt text. */
  alt: string;
  /** Primary caption — short, evocative. */
  caption: string;
  /** Optional 911Porsche-styled meta line (location / spec / tooling). */
  metadata?: string;
  /** Optional one-liner that fades in on hover. */
  story?: string;
  /** Featured tiles span 2 columns on desktop. */
  featured?: boolean;
  /** Approximate aspect ratio — used for skeleton sizing pre-load. */
  aspect?: '16/9' | '4/3' | '1/1';
};

export const WORKSHOP_PHOTOS: WorkshopPhoto[] = [
  {
    src: '/images/hero-poster.jpg',
    alt: 'Inside the MBR workshop. A luxury car being serviced',
    caption: 'On the floor',
    metadata: 'BAY 1 · Climate-controlled · Ferrari + Lamborghini',
    story: 'Where the cars Dubai cares about spend a quiet afternoon.',
    featured: true,
    aspect: '16/9',
  },
  {
    src: '/images/mbr_mechanic.webp',
    alt: 'MBR technician at work on an engine',
    caption: 'Engine bay',
    metadata: 'OEM tooling · Bosch-authorised',
    story: 'Engine work to factory spec. Torque values, intervals, traceable parts.',
    aspect: '4/3',
  },
  {
    src: '/images/mbr_electrical.webp',
    alt: 'Electrical diagnostics in progress',
    caption: 'Diagnostics',
    metadata: 'Leonardo platform · ECU read & code',
    story: 'The same toolchain Ferrari technicians use at the factory.',
    aspect: '4/3',
  },
  {
    src: '/images/mbr_suspension.webp',
    alt: 'Suspension service on a luxury vehicle',
    caption: 'Suspension & steering',
    metadata: 'Laser alignment · Air suspension',
    story: 'Ride-height calibration to the millimetre. The handling owners pay for.',
    aspect: '4/3',
  },
  {
    src: '/images/mbr_maintainence.webp',
    alt: 'Preventive maintenance check',
    caption: 'Preventive care',
    metadata: 'Manufacturer schedule · Full history',
    story: 'Routine inspection. Itemised, transparent, photographed.',
    aspect: '4/3',
  },
];
