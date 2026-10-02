'use client';

import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Can I monetize videos created with GenZee voices on YouTube?',
    a: 'Yes, absolutely. The synthesized audio generated via ElevenLabs, Fish Audio, and Google Gemini models is fully permitted for commercial monetization across YouTube AdSense, sponsored videos, podcasts, and digital products.',
  },
  {
    q: 'How does Facebook and Instagram publishing work?',
    a: 'GenZee connects directly to the official Pages and Channels. Once you connect your Facebook Page, Instagram Profile, and Youtube Channel you can draft video captions, attach audio or video assets, and schedule published Reels or feed updates directly from your dashboard.',
  },
  {
    q: 'What is the Prompt-to-JSON Campaign feature?',
    a: 'You can ask any external AI (like ChatGPT, Claude, or DeepSeek) to generate a multi-day or multi-week content plan in JSON format. When you paste that JSON into GenZee, it converts it into a visual calendar with daily hooks, scripts, and 1-click voice synthesis triggers.',
  },
  {
    q: 'Is there an offline mode or guest access?',
    a: 'Yes! When logged in, your history and presets sync securely across your devices. In guest mode, all your scripts and voiceover projects remain 100% private and stored locally on your device with zero server tracking.',
  },
  {
    q: 'What audio formats are exported?',
    a: 'All synthesized voiceovers can be downloaded directly in uncompressed 24kHz WAV format, providing crystal-clear studio fidelity without MP3 compression artifacts.',
  },
];

export default function LandingCreatorFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading - Clean typography, zero AI chips */}
        <div className="text-center space-y-4 mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Everything you need to know about GenZee Video, licensing, and workflow automation.
          </p>
        </div>

        {/* FAQ Accordion List (Single level cards, no nested borders) */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <FiChevronDown
                    className={`text-slate-400 text-lg shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#ff7d6e]' : ''
                      }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
