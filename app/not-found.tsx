import React from 'react';
import Link from 'next/link';
import { FiHome, FiBookOpen, FiHelpCircle, FiArrowRight } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-16 text-slate-900 font-sans">
      <div className="max-w-xl w-full text-center space-y-6 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-[#c83a2a] text-2xl font-black border border-orange-200/80">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
            The page you are looking for might have been moved, renamed, or is temporarily unavailable. Explore our studio resources below to get back on track.
          </p>
        </div>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <Link
            href="/"
            className="p-3.5 rounded-xl border border-slate-200/90 hover:border-[#ff9b8f] hover:bg-orange-50/40 transition-all flex flex-col gap-1 group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-[#c83a2a]">
              <FiHome className="w-3.5 h-3.5" />
              <span>Studio Home</span>
            </div>
            <p className="text-[11px] text-slate-500">Voice synthesis & scheduling</p>
          </Link>

          <Link
            href="/blog"
            className="p-3.5 rounded-xl border border-slate-200/90 hover:border-[#ff9b8f] hover:bg-orange-50/40 transition-all flex flex-col gap-1 group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-[#c83a2a]">
              <FiBookOpen className="w-3.5 h-3.5" />
              <span>Creator Blog</span>
            </div>
            <p className="text-[11px] text-slate-500">Guides, tutorials & AI news</p>
          </Link>

          <Link
            href="/faq"
            className="p-3.5 rounded-xl border border-slate-200/90 hover:border-[#ff9b8f] hover:bg-orange-50/40 transition-all flex flex-col gap-1 group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-[#c83a2a]">
              <FiHelpCircle className="w-3.5 h-3.5" />
              <span>Help &amp; FAQ</span>
            </div>
            <p className="text-[11px] text-slate-500">Licensing &amp; technical answers</p>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <span>Return to GenZee Studio</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
