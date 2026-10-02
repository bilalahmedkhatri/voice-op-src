'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiMenu, FiX, FiPlay } from 'react-icons/fi';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#e04836] via-[#ff7d6e] to-[#ff9b8f] flex items-center justify-center text-white font-black text-sm shadow-xs">
            GZ
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight leading-none text-slate-900 text-lg">GenZee</span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">Content Studio</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
            How It Works
          </a>
          <a href="#live-studio" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <FiPlay className="text-xs text-[#ff7d6e]" />
            <span>Voice Studio</span>
          </a>
          <a href="#json-engine" className="hover:text-slate-900 transition-colors">
            JSON Engine
          </a>
          <a href="#social-mockup" className="hover:text-slate-900 transition-colors">
            Feed Simulator
          </a>
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Pillars
          </a>
          <a href="#specs" className="hover:text-slate-900 transition-colors">
            Specs
          </a>
          <a href="#faq" className="hover:text-slate-900 transition-colors">
            FAQ
          </a>
        </nav>

        {/* CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <span>Launch Studio</span>
            <FiArrowRight className="text-sm" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/admin"
            className="px-3.5 py-1.5 bg-[#ff7d6e] text-white rounded-lg text-xs font-semibold"
          >
            Studio
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#c83a2a]"
            >
              How It Works
            </a>
            <a
              href="#live-studio"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#c83a2a]"
            >
              Voice Synthesis Demo
            </a>
            <a
              href="#json-engine"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#c83a2a]"
            >
              JSON Campaign Engine
            </a>
            <a
              href="#social-mockup"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#c83a2a]"
            >
              Social Feed Simulator
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#c83a2a]"
            >
              Core Capabilities
            </a>
            <a
              href="#specs"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#c83a2a]"
            >
              Architecture &amp; Specs
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#c83a2a]"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/admin"
              className="w-full py-2.5 text-center bg-[#ff7d6e] text-white font-semibold rounded-xl text-xs"
            >
              Launch Studio Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
