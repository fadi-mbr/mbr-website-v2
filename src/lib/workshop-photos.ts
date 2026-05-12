/**
 * Workshop gallery manifest — single source of truth for what renders in
 * <OurWorkshop />. To swap photos, drop new files under
 * `public/images/workshop/` and update this array.
 *
 * `featured: true` makes a tile span 2 columns on desktop. Only one
 * featured tile is sensible.
 *
 * Until dedicated workshop photography lands, this manifest reuses the
 * existing service-themed images plus the hero poster — all of which are
 * legitimate "inside the workshop" shots.
 */

export type WorkshopPhoto = {
  /** Path under /public, served as /[src]. */
  src: string;
  /** Alt text + caption — captions display subtly under each tile. */
  alt: string;
  caption: string;
  /** Featured tiles span 2 columns on desktop. */
  featured?: boolean;
  /** Approximate aspect ratio — used for skeleton sizing pre-load. */
  aspect?: '16/9' | '4/3' | '1/1';
};

export const WORKSHOP_PHOTOS: WorkshopPhoto[] = [
  {
    src: '/images/hero-poster.jpg',
    alt: 'Inside the MBR workshop — a luxury car being serviced',
    caption: 'On the floor',
    featured: true,
    aspect: '16/9',
  },
  {
    src: '/images/mbr_mechanic.webp',
    alt: 'MBR technician at work on an engine',
    caption: 'Engine bay',
    aspect: '4/3',
  },
  {
    src: '/images/mbr_electrical.webp',
    alt: 'Electrical diagnostics in progress',
    caption: 'Diagnostics',
    aspect: '4/3',
  },
  {
    src: '/images/mbr_suspension.webp',
    alt: 'Suspension service on a luxury vehicle',
    caption: 'Suspension & steering',
    aspect: '4/3',
  },
  {
    src: '/images/mbr_maintainence.webp',
    alt: 'Preventive maintenance check',
    caption: 'Preventive care',
    aspect: '4/3',
  },
];
