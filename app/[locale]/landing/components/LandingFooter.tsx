'use client';

import React from 'react';
import {
  FooterBrandCard,
  FooterNavColumns,
  FooterBottomBar,
} from './footer';

export default function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Pre-Footer High-Impact CTA Banner */}
        {/* 2. Main Navigation & Brand Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-12">
          {/* Brand & Guarantee Card */}
          <div className="lg:col-span-4 xl:col-span-5">
            <FooterBrandCard />
          </div>

          {/* Structured Navigation Columns */}
          <div className="lg:col-span-8 xl:col-span-7">
            <FooterNavColumns />
          </div>
        </div>

        {/* 4. Bottom Legal, Copyright & Back-to-Top Bar */}
        <FooterBottomBar />
      </div>
    </footer>
  );
}
