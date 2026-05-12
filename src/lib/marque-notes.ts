/**
 * Per-marque hover tooltip data for the BrandsStrip.
 *
 * Keyed by lowercase marque slug. Each entry is the short bronze-eyebrow
 * label plus a one-liner under the logo. Keep it factual — what we
 * actually do, not aspirational.
 */

export type MarqueNote = {
  /** Display name shown above the logo on hover. */
  name: string;
  /** Tier classification (Supercar / Ultra-Luxury / Luxury & Sport). */
  tier: 'Supercar' | 'Ultra-Luxury' | 'Luxury & Sport';
  /** Single-sentence specialty note. */
  note: string;
};

export const MARQUE_NOTES: Record<string, MarqueNote> = {
  ferrari: {
    name: 'Ferrari',
    tier: 'Supercar',
    note: 'Leonardo diagnostics, OEM parts, V8 and V12 service history.',
  },
  lamborghini: {
    name: 'Lamborghini',
    tier: 'Supercar',
    note: 'Aventador, Huracán and Urus. Engine, drivetrain, chassis.',
  },
  mclaren: {
    name: 'McLaren',
    tier: 'Supercar',
    note: 'Carbon tub service, M-series engine work, suspension.',
  },
  'rolls-royce': {
    name: 'Rolls-Royce',
    tier: 'Ultra-Luxury',
    note: 'Phantom, Ghost, Cullinan. Coachwork-grade attention.',
  },
  bentley: {
    name: 'Bentley',
    tier: 'Ultra-Luxury',
    note: 'Continental GT, Flying Spur and Bentayga, full service history.',
  },
  porsche: {
    name: 'Porsche',
    tier: 'Luxury & Sport',
    note: '911, Cayenne, Macan. Air-cooled to current-gen.',
  },
  maserati: {
    name: 'Maserati',
    tier: 'Luxury & Sport',
    note: 'Ghibli, Levante, Quattroporte. Italian luxury sport.',
  },
  'mercedes-benz': {
    name: 'Mercedes-Benz',
    tier: 'Luxury & Sport',
    note: 'S-Class, G-Wagen, AMG. Bosch-authorised expertise.',
  },
  bmw: {
    name: 'BMW',
    tier: 'Luxury & Sport',
    note: 'M-cars and the wider line. Diagnostics and engine work.',
  },
  audi: {
    name: 'Audi',
    tier: 'Luxury & Sport',
    note: 'RS, S-line and the regular range. Full service.',
  },
  'land-rover': {
    name: 'Range Rover',
    tier: 'Luxury & Sport',
    note: 'Range Rover, Sport, Defender. Air suspension specialists.',
  },
  jaguar: {
    name: 'Jaguar',
    tier: 'Luxury & Sport',
    note: 'F-Type, XJ and the SUV range.',
  },
};
