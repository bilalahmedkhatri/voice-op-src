'use client';

import React from 'react';
import Link from 'next/link';
import { FiRadio, FiShield, FiCheckCircle } from 'react-icons/fi';

export default function FooterBrandCard() {
  return (
    <div className="space-y-4">
      {/* Brand Logo & Name */}
      <Link href="/" className="inline-flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e04836] via-[#ff7d6e] to-[#ff9b8f] flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
          GZ
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-white text-xl leading-none">
            GenZee Video
          </span>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">
            genzee.video
          </span>
        </div>
      </Link>

      {/* Value Statement */}
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
        The premier AI voice synthesis and multi-platform content automation studio for creators, channels, and digital agencies worldwide.
      </p>

      {/* Key Guarantees */}
      <div className="space-y-1.5 pt-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FiCheckCircle className="text-[#ff7d6e] text-xs shrink-0" />
          <span>24kHz uncompressed WAV audio exports</span>
        </div>
        <div className="flex items-center gap-2">
          <FiShield className="text-emerald-400 text-xs shrink-0" />
          <span>Complete creator data ownership &amp; privacy</span>
        </div>
      </div>
    </div>
  );
}
