import React from "react";
import { FiZap, FiBarChart2, FiLayers, FiDatabase } from "react-icons/fi";

interface SettingsStatsProps {
  quota: {
    generations_used: number;
    max_daily_generations: number;
    max_chars_per_request: number;
    chars_used_today: number;
    max_daily_chars: number;
    reset_at: string;
  } | null;
  totalTemplates: number;
}

export default function SettingsStats({ quota, totalTemplates }: SettingsStatsProps) {
  const generationsPercent = quota
    ? Math.min(100, Math.round((quota.generations_used / quota.max_daily_generations) * 100))
    : 0;

  const charsPercent = quota
    ? Math.min(100, Math.round((quota.chars_used_today / quota.max_daily_chars) * 100))
    : 0;

  const remainingGens = quota ? Math.max(0, quota.max_daily_generations - quota.generations_used) : 0;
  const remainingChars = quota ? Math.max(0, quota.max_daily_chars - quota.chars_used_today) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Generations */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily Generations</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FiZap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {quota ? quota.generations_used : 0}
          </span>
          <span className="text-sm text-slate-400 font-mono">/ {quota ? quota.max_daily_generations : 100}</span>
        </div>
        <div className="mt-3">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                generationsPercent >= 90
                  ? "bg-rose-500"
                  : generationsPercent >= 70
                  ? "bg-amber-500"
                  : "bg-blue-600"
              }`}
              style={{ width: `${generationsPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            {remainingGens} generations left today
          </p>
        </div>
      </div>

      {/* Card 2: Characters Used */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Characters Used</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FiBarChart2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {quota ? quota.chars_used_today.toLocaleString() : "0"}
          </span>
        </div>
        <div className="mt-3">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                charsPercent >= 90
                  ? "bg-rose-500"
                  : charsPercent >= 70
                  ? "bg-amber-500"
                  : "bg-emerald-600"
              }`}
              style={{ width: `${charsPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            {remainingChars.toLocaleString()} chars remaining
          </p>
        </div>
      </div>

      {/* Card 3: Max Per Request */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Request Limit</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FiLayers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {quota ? quota.max_chars_per_request.toLocaleString() : "10,000"}
          </span>
          <span className="text-sm text-slate-400">chars</span>
        </div>
        <p className="mt-4 text-xs text-slate-500 font-medium">
          Maximum single voice generation batch
        </p>
      </div>

      {/* Card 4: Saved Templates (Replacing Daily Reset with user DB metric) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saved Templates</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FiDatabase className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {totalTemplates}
          </span>
          <span className="text-sm text-slate-400">templates</span>
        </div>
        <p className="mt-4 text-xs text-slate-500 font-medium">
          Stored in your private database
        </p>
      </div>
    </div>
  );
}
