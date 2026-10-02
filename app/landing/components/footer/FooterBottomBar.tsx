'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowUp } from 'react-icons/fi';

export default function FooterBottomBar() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
        <p>
          &copy; {new Date().getFullYear()} GenZee Video (<span className="font-mono text-slate-400">genzee.video</span>). All rights reserved.
        </p>
        <span className="hidden sm:inline text-slate-700">•</span>
        <span className="text-slate-400">
          Engineered for creator performance, security &amp; privacy.
        </span>
      </div>

      <div className="flex items-center gap-4 flex-wrap justify-center">
        <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms-of-service" className="hover:text-slate-300 transition-colors">
          Terms of Service
        </Link>
        <Link href="/faq" className="hover:text-slate-300 transition-colors">
          FAQ
        </Link>
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer ml-2 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80"
          title="Back to top"
        >
          <span>Top</span>
          <FiArrowUp className="text-[10px]" />
        </button>
      </div>
    </div>
  );
}
