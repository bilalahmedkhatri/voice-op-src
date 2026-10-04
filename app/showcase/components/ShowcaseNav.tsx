'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowRight, FiPlay, FiShare2, FiFileText, FiLayout } from 'react-icons/fi';

export default function ShowcaseNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/showcase" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#e04836] via-[#ff7d6e] to-[#ff9b8f] flex items-center justify-center text-white font-black text-sm shadow-xs">
            GZ
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight leading-none text-slate-900 text-lg">GenZee</span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">Interactive Studio Showcase</span>
          </div>
        </Link>

        {/* Feature Anchors */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#voice-hero" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <FiPlay className="text-xs text-[#ff7d6e]" /> Voice Synthesizer
          </a>
          <a href="#json-engine" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <FiFileText className="text-xs text-[#ff7d6e]" /> JSON Strategy Engine
          </a>
          <a href="#social-mockup" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <FiShare2 className="text-xs text-[#ff7d6e]" /> Social Mockup Simulator
          </a>
        </nav>

        {/* Action Button to Launch Workspace Studio */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff7d6e] hover:bg-[#e04836] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <span>Open Studio</span>
            <FiArrowRight className="text-sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}
