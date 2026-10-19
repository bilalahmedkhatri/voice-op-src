'use client';

import {useCopy} from '@/i18n/copy';

import React from 'react';
import {Link} from '@/i18n/navigation';
import { FiRadio, FiShield, FiCheckCircle } from 'react-icons/fi';

export default function FooterBrandCard() {
  const copy = useCopy();


  return (
    <div className="space-y-4">
      <Link href="/" className="inline-flex items-center gap-2.5 group">
        <img
          src="/logo.jpg"
          alt={copy("GenZee Video Logo")}
          className="w-9 h-9 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform border border-slate-700/60"
        />
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-white text-xl leading-none">
            {copy("GenZee Video")}</span>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">
            {copy("genzee.video")}</span>
        </div>
      </Link>

      {/* Value Statement */}
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
        {copy("The premier AI voice synthesis and multi-platform content automation studio for creators, channels, and digital agencies worldwide.")}</p>

      {/* Key Guarantees */}
      <div className="space-y-1.5 pt-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FiCheckCircle className="text-[#ff7d6e] text-xs shrink-0" />
          <span>{copy("24kHz uncompressed WAV audio exports")}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiShield className="text-emerald-400 text-xs shrink-0" />
          <span>{copy("Complete creator data ownership & privacy")}</span>
        </div>
      </div>
    </div>
  );
}
