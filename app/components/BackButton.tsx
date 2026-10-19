'use client';

import {useCopy} from '@/i18n/copy';

import React from 'react';
import {Link} from '@/i18n/navigation';
import { FaArrowLeft } from 'react-icons/fa';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({ href = '/', label = 'BACK' }: BackButtonProps) {
  const copy = useCopy();


  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 text-slate-600 hover:text-[#c83a2a] group transition-colors font-medium text-sm mb-6 cursor-pointer"
      aria-label={copy("Back to {v0}", {v0: label})}
    >
      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs group-hover:bg-orange-50 group-hover:border-[#ff9b8f]/60 group-hover:text-[#c83a2a] flex items-center justify-center transition-all">
        <FaArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      </span>
      <span className="text-xs uppercase tracking-wider font-semibold">{copy(label)}</span>
    </Link>
  );
}
