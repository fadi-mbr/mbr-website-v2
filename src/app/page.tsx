"use client";

import React from 'react';
import ProfessionalNavigation from '@/components/ProfessionalNavigation';
import SophisticatedHero from '@/components/SophisticatedHero';
import BrandsStrip from '@/components/BrandsStrip';
import SophisticatedServices from '@/components/SophisticatedServices';
import SectionBreak from '@/components/SectionBreak';
import OurWorkshop from '@/components/OurWorkshop';
import WhyMbr from '@/components/WhyMbr';
import SophisticatedReviews from '@/components/SophisticatedReviews';
import ContactSection from '@/components/ContactSection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <ProfessionalNavigation />
      <SophisticatedHero />
      <BrandsStrip />
      <SophisticatedServices />

      {/* Workshop interrupt — full-bleed photographic break between
          Services (what we do) and the Workshop gallery (where we do it). */}
      <SectionBreak
        image="/images/hero-poster.jpg"
        alt="MBR workshop floor at golden hour"
        headline="We obsess over every detail."
        subline="The next gallery is a quick look inside."
        variant="bold"
      />

      <OurWorkshop />
      <WhyMbr />
      <SophisticatedReviews />

      {/* Contact interrupt — slim full-bleed strip with the address in
          911Porsche and a direct-to-Maps link. McLaren end-of-page pattern. */}
      <SectionBreak
        image="/images/mbr_mechanic.webp"
        alt="MBR workshop exterior in Al Quoz"
        headline="16 8 St · Al Quoz Industrial 4"
        subline="Dubai · UAE"
        ctaHref="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
        ctaLabel="Get directions"
        variant="slim"
      />

      <ContactSection />
    </div>
  );
}
