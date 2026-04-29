/**
 * Structured Data (Schema.org JSON-LD) for SEO
 *
 * This file contains schema markup to help search engines understand
 * the business, services, and content of MBR Auto Services.
 */

import { BUSINESS_HOURS } from './business-hours';

export const autoRepairSchema = {
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "name": "MBR Making Better Rides",
  "image": "https://mbrme.com/images/Logo_MBRauto_noWhite_small.png",
  "description": "Premium car repair and luxury auto service in Dubai, UAE. 15+ years experience servicing Mercedes, BMW, Audi, Porsche and all premium brands.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "16 8 St Al Qouz Ind.fourth",
    "addressLocality": "Al Quoz",
    "addressRegion": "Dubai",
    "addressCountry": "AE"
  },
  "url": "https://mbrme.com",
  "telephone": "+971565015800",
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [...BUSINESS_HOURS.schemaDays],
      "opens": BUSINESS_HOURS.schemaOpens,
      "closes": BUSINESS_HOURS.schemaCloses
    }
  ],
  "areaServed": {
    "@type": "City",
    "name": "Dubai"
  },
  "serviceType": [
    "Mechanical Repairs",
    "Electrical Diagnostics",
    "Suspension & Steering",
    "Maintenance Services"
  ],
  "brand": {
    "@type": "Brand",
    "name": "Bosch"
  }
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MBR Making Better Rides",
  "url": "https://mbrme.com",
  "logo": "https://mbrme.com/images/Logo_MBRauto_noWhite_small.png",
  "description": "Premium car repair and luxury auto service in Dubai, UAE",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dubai",
    "addressRegion": "Dubai",
    "addressCountry": "AE"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+971565015800",
    "contactType": "customer service",
    "areaServed": "AE",
    "availableLanguage": ["en", "ar"]
  },
  "sameAs": [
    // TODO: Add social media URLs when available
    // "https://www.facebook.com/...",
    // "https://www.instagram.com/...",
  ]
};

export const aggregateRatingSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MBR Making Better Rides",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "883",
    "bestRating": "5",
    "worstRating": "1"
  }
};

