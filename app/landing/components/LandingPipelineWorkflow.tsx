'use client';

import React from 'react';
import { FiCode, FiMic, FiShare2, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

const STEPS = [
  {
    step: '01',
    title: 'Prompt & JSON Campaign Ingestion',
    icon: FiCode,
    href: '/json-generator',
    description:
      'Prompt any external AI (Claude, ChatGPT, Gemini, DeepSeek) to generate a multi-week campaign. Paste the raw JSON directly into GenZee to instantly generate structured daily calendars, hooks, and video scripts.',
    badge: 'Multi-LLM Compatible',
  },
  {
    step: '02',
    title: 'Studio-Grade Multi-Model Synthesis',
    icon: FiMic,
    href: '/admin',
    description: 'Turn scripts into lifelike voiceovers using ElevenLabs, Fish Audio, and Google Gemini. Choose from premium voices, dial in speed and pitch, and optimize audio for 9:16 vertical Reels or 16:9 widescreen YouTube videos.',
    badge: 'Real-Time Neural Synthesis',
  },
  {
    step: '03',
    title: '1-Click Multi-Platform Publishing',
    icon: FiShare2,
    href: '/facebook/integration',
    description:
      'Preview your content inside authentic Facebook Feed and Instagram Reel device mockups. Publish immediately or schedule posts up to 75 days in advance directly to your connected channels.',
    badge: '1-Click Publishing',
  },
];

export default function LandingPipelineWorkflow() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-slate-50/70 border-t border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading - Clean typography, zero AI chips */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            From Raw Prompt to Published Video in Three Steps
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Stop switching between four different disconnected tools. GenZee unites content ideation,
            voice synthesis, and social automation into one seamless pipeline.
          </p>
        </div>

        {/* 3 Steps Grid (Single-level cards, no multi-wrapping) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow relative"
              >
                <div className="space-y-4">
                  {/* Top row: Number & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl font-black text-slate-200 font-mono">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center text-lg">
                      <Icon />
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">{item.badge}</span>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 font-bold text-[#c83a2a] hover:underline"
                  >
                    <span>Try it</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
