'use client';

import React from 'react';
import {
  FiZap,
  FiVolume2,
  FiShield,
  FiShare2,
  FiGift,
  FiLayers,
} from 'react-icons/fi';

const SPECS = [
  {
    icon: FiZap,
    stat: '1.2s',
    label: 'Model Inference Speed',
    detail: 'Ultra-fast speech generation powered by ElevenLabs, Fish Audio & Gemini neural pipelines.',
  },
  {
    icon: FiVolume2,
    stat: '54+',
    label: 'Natural Studio Voices',
    detail: 'Curated male, female, and neutral voices across various regional accents.',
  },
  {
    icon: FiShield,
    stat: 'Dual Mode',
    label: 'Cloud Sync & Offline Privacy',
    detail: 'Seamlessly auto-sync presets and history when signed in, or work 100% privately in offline mode with zero server tracking.',
  },
  {
    icon: FiShare2,
    stat: '1-Click',
    label: 'Multi-Platform Publishing',
    detail: 'Direct publishing to Facebook Pages & Instagram Business accounts.',
  },
  {
    icon: FiGift,
    stat: '100% Free',
    label: 'Studio Plan Access',
    detail: 'Generous daily generations with automatic UTC midnight quota resets.',
  },
  {
    icon: FiLayers,
    stat: '24kHz WAV',
    label: 'Uncompressed Studio Audio',
    detail: 'Zero compression artifacts; ready for DaVinci Resolve, CapCut, and Premiere.',
  },
];

export default function LandingHonestSpecsGrid() {
  return (
    <section id="specs" className="py-16 sm:py-20 lg:py-24 bg-slate-50/70 border-t border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading - Clean typography, zero AI chips */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Engineered for Creator Performance &amp; Privacy
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Transparent studio performance backed by ultra-low latency neural speech engines and creator privacy.
          </p>
        </div>

        {/* 6-Card Grid (Single level containers, no nested borders) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 space-y-3 shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center text-lg">
                  <Icon />
                </div>

                <div className="pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight block">
                    {item.stat}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 mt-1 block">
                    {item.label}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
