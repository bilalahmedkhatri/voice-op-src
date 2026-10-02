'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function ShowcaseFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#e04836] via-[#ff7d6e] to-[#ff9b8f] flex items-center justify-center text-white font-black text-sm">
                GZ
              </div>
              <span className="font-extrabold tracking-tight text-white text-xl">GenZee Video</span>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-md">
              The all-in-one AI voice &amp; multi-platform content automation studio for YouTube, Facebook, and Instagram.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff7d6e] hover:bg-[#e04836] text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <span>Launch GenZee Studio</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <nav className="flex items-center gap-6 flex-wrap">
            <Link href="/" className="hover:text-slate-300 transition-colors">Studio</Link>
            <Link href="/blog" className="hover:text-slate-300 transition-colors">Blog</Link>
            <Link href="/about-us" className="hover:text-slate-300 transition-colors">About Us</Link>
            <Link href="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
            <Link href="/terms-of-service" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          </nav>

          <p>&copy; {new Date().getFullYear()} GenZee Video (genzee.video). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
