"use client";

import React from 'react';
import { MotionConfig } from 'framer-motion';
import ProfessionalNavigation from '@/components/ProfessionalNavigation';
import SophisticatedHero from '@/components/SophisticatedHero';
import BrandsStrip from '@/components/BrandsStrip';
import SophisticatedServices from '@/components/SophisticatedServices';
import SectionBreak from '@/components/SectionBreak';
import OurWorkshop from '@/components/OurWorkshop';
import WhyMbr from '@/components/WhyMbr';
import TeamSection from '@/components/TeamSection';
import SophisticatedReviews from '@/components/SophisticatedReviews';
import ContactSection from '@/components/ContactSection';

export default function HomePage() {
  return (
    // Phase C: MotionConfig respects `prefers-reduced-motion: reduce`
    // globally. The CSS media query in globals.css catches CSS-driven
    // motion; this catches framer-motion's JS-driven animations.
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-black text-white">
        <ProfessionalNavigation />
        {/* Phase C: <main> landmark + id="main-content" for the skip link. */}
        <main id="main-content" tabIndex={-1}>
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
          <TeamSection />
          <SophisticatedReviews />

          {/* Contact interrupt — slim full-bleed strip with the address
              and a direct-to-Maps link. McLaren end-of-page pattern. */}
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
        </main>
      </div>
    </MotionConfig>
  );
}
