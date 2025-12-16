"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BookingWizard from '@/components/booking/BookingWizard';

export default function BookPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <BookingWizard />
    </div>
  );
}

