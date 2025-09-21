"use client";

import React from 'react';
import ProfessionalNavigation from '@/components/ProfessionalNavigation';
import SophisticatedHero from '@/components/SophisticatedHero';
import SophisticatedServices from '@/components/SophisticatedServices';
import SophisticatedReviews from '@/components/SophisticatedReviews';
import AboutSection from '@/components/AboutSection';
import SophisticatedTeam from '@/components/SophisticatedTeam';
import ContactSection from '@/components/ContactSection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <ProfessionalNavigation />
      <SophisticatedHero />
      <SophisticatedServices />
      <SophisticatedReviews />
      <AboutSection />
      <SophisticatedTeam />
      <ContactSection />
    </div>
  );
}