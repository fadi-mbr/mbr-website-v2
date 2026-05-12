"use client";

import React from 'react';
import ProfessionalNavigation from '@/components/ProfessionalNavigation';
import SophisticatedHero from '@/components/SophisticatedHero';
import BrandsStrip from '@/components/BrandsStrip';
import SophisticatedServices from '@/components/SophisticatedServices';
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
      <OurWorkshop />
      <WhyMbr />
      <SophisticatedReviews />
      <ContactSection />
    </div>
  );
}
