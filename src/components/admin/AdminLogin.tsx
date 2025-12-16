"use client";

import React from 'react';
import { signIn } from 'next-auth/react';

export default function AdminLogin() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="glass-card p-12 max-w-md w-full text-center">
        <h1 className="text-display font-light gradient-text mb-4">
          Admin Login
        </h1>
        <p className="text-body-enhanced mb-8">
          Sign in with your @mbrme.com Google account to access the admin dashboard.
        </p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/admin' })}
          className="liquid-glass-btn liquid-glass-btn-primary w-full"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

