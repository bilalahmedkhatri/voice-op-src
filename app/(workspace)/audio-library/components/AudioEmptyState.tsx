'use client';

import React from 'react';
import Link from 'next/link';
import { FiMusic } from 'react-icons/fi';

interface AudioEmptyStateProps {
  authenticated: boolean;
}

export default function AudioEmptyState({ authenticated }: AudioEmptyStateProps) {
  return (
    <div className="py-16 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center mb-3">
        <FiMusic className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">No Audio Files Found</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        {authenticated
          ? 'You haven’t generated any voiceovers yet. Create your first audio track in Voice Studio.'
          : 'Please sign in with your Google account to access your saved audio files.'}
      </p>
      {authenticated ? (
        <Link
          href="/admin"
          className="mt-4 px-4 py-1.5 rounded-xl bg-[#ff7d6e] hover:bg-[#e04836] text-white text-xs font-bold transition-all shadow-2xs"
        >
          Create Voiceover
        </Link>
      ) : null}
    </div>
  );
}
