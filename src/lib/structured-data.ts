/**
 * Structured Data (Schema.org JSON-LD) for SEO.
 *
 * Positions MBR as a luxury / supercar specialist (Ferrari, Lamborghini,
 * Rolls-Royce). Brand list mirrors PremiumBrandsCarousel and the keep-list
 * decision; if either changes, update both.
 */

import { BUSINESS_HOURS } from './business-hours';

const SITE_URL = 'https://mbrme.com';
const LOGO_URL = `${SITE_URL}/images/Logo_MBRauto_noWhite_small.png`;
const PHONE = '+971565015800';

/** Brands MBR services, in priority/marketing order. */
const SERVICED_BRANDS = [
  'Ferrari',
  'Lamborghini',
  'Rolls-Royce',
  'Bentley',
  'McLaren',
  'Maserati',
  'Porsche',
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Range Rover',
  'Jaguar',
] as const;

/** Service categories surfaced on the site, with luxury-aware descriptions. */
const SERVICE_CATALOG = [
  {
    name: 'Mechanical Repairs',
    description:
      'Engine, transmission, clutch and brake work for Ferrari, Lamborghini, Porsche and the wider luxury lineup.',
  },
  {
    name: 'Electrical & ECU Diagnostics',
    description:
      'Manufacturer-level ECU diagnostics, wiring, alternator and battery service for Rolls-Royce, Bentley and modern luxury electronics.',
  },
  {
    name: 'Suspension & Steering',
    description:
      'Air-suspension service, alignment and steering work for ultra-luxury and supercar chassis.',
  },
  {
    name: 'Preventive Maintenance',
    description:
      'Scheduled luxury car servicing, fluid changes, AC service and pre-purchase inspections.',
  },
];

export const autoRepairSchema = {
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  '@id': `${SITE_URL}#business`,
  name: 'MBR Making Better Rides',
  alternateName: 'MBR Auto Services',
  image: LOGO_URL,
  logo: LOGO_URL,
  description:
    "Independent luxury workshop in Dubai. Trusted by Ferrari, Lamborghini and Rolls-Royce owners; experienced with Bentley, McLaren, Maserati, Porsche, Mercedes-Benz, BMW, Audi, Range Rover and Jaguar. Bosch-authorised, OEM-level diagnostics, genuine OEM parts. 15+ years in Al Quoz Industrial 4.",
  address: {
    '@type': 'PostalAddress',
    streetAddress: '16 8 St Al Quoz Industrial 4',
    addressLocality: 'Al Quoz',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  url: SITE_URL,
  telephone: PHONE,
  priceRange: '$$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [...BUSINESS_HOURS.schemaDays],
      opens: BUSINESS_HOURS.schemaOpens,
      closes: BUSINESS_HOURS.schemaCloses,
    },
  ],
  areaServed: [
    { '@type': 'City', name: 'Dubai' },
    { '@type': 'Country', name: 'United Arab Emirates' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Luxury & Supercar Services',
    itemListElement: SERVICE_CATALOG.map((s) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: s.name,
        description: s.description,
        areaServed: 'Dubai, United Arab Emirates',
      },
    })),
  },
  // Marques serviced — gives Google a structured list of brands.
  brand: SERVICED_BRANDS.map((b) => ({ '@type': 'Brand', name: b })),
  makesOffer: SERVICED_BRANDS.map((b) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: `${b} repair and service`,
      brand: { '@type': 'Brand', name: b },
      areaServed: 'Dubai, United Arab Emirates',
    },
  })),
  knowsAbout: [
    'Ferrari servicing',
    'Lamborghini servicing',
    'Rolls-Royce servicing',
    'Bentley servicing',
    'Luxury vehicle maintenance',
    'Supercar maintenance',
    'OEM-level diagnostics',
    'Bosch authorised diagnostics',
    'Genuine OEM parts',
  ],
  slogan: "Dubai's independent luxury workshop",
};

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: 'MBR Making Better Rides',
  alternateName: 'MBR Auto Services',
  url: SITE_URL,
  logo: LOGO_URL,
  description:
    "Independent luxury workshop in Dubai trusted by Ferrari, Lamborghini and Rolls-Royce owners. Bosch-authorised; OEM-level diagnostics; genuine OEM parts.",
  address: {
    '@type': 'PostalAddress',
    streetAddress: '16 8 St Al Quoz Industrial 4',
    addressLocality: 'Al Quoz',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: PHONE,
    contactType: 'customer service',
    areaServed: 'AE',
    availableLanguage: ['en'],
  },
  sameAs: [
    'https://www.instagram.com/mbr.auto/',
    'https://www.facebook.com/mbrautoservices/',
    'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6',
  ],
};

export const aggregateRatingSchema = {
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  '@id': `${SITE_URL}#business-rating`,
  name: 'MBR Making Better Rides',
  url: SITE_URL,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '883',
    bestRating: '5',
    worstRating: '1',
  },
};
