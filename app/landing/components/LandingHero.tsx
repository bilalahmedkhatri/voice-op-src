'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowRight, FiPlay, FiCheckCircle } from 'react-icons/fi';

export default function LandingHero() {
  return (
    <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Main Headline - Bold Editorial Typography, Zero AI Chips on top */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
          The AI Voice &amp; Content Automation Studio for Modern Creators
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
          From raw scripts to life like multi-model voiceovers, structured YouTube strategies,
          and automated Facebook &amp; Instagram Reels in minutes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-sm sm:text-base font-semibold shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2.5"
          >
            <span>Launch Studio Free</span>
            <FiArrowRight className="text-base" />
          </Link>

          <a
            href="#live-studio"
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 rounded-xl text-sm sm:text-base font-semibold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <FiPlay className="text-[#ff7d6e] text-sm" />
            <span>Try Live Speech Synthesis</span>
          </a>
        </div>
      </div>
    </section>
  );
}
