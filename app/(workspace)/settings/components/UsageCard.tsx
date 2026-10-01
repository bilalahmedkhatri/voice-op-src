import React from "react";
import { FiBarChart2 } from "react-icons/fi";

interface UserQuota {
  generations_used: number;
  max_daily_generations: number;
  max_chars_per_request: number;
  chars_used_today: number;
  max_daily_chars: number;
  reset_at: string;
}

interface UsageCardProps {
  quota: UserQuota | null;
}

export default function UsageCard({ quota }: UsageCardProps) {
  if (!quota) return null;

  const generationsPercent = Math.min(
    100,
    Math.round((quota.generations_used / quota.max_daily_generations) * 100)
  );

  const charsPercent = Math.min(
    100,
    Math.round((quota.chars_used_today / quota.max_daily_chars) * 100)
  );

  const remainingGens = Math.max(0, quota.max_daily_generations - quota.generations_used);
  const remainingChars = Math.max(0, quota.max_daily_chars - quota.chars_used_today);

  const formatResetTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiBarChart2 className="w-4 h-4 text-[#ff7d6e]" />
          <h3 className="text-sm font-semibold text-slate-900">Usage Details</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">24h Quota</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Generation Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Voice Generations</span>
            <span className="font-mono font-bold text-slate-900">
              {generationsPercent}% ({quota.generations_used}/{quota.max_daily_generations})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                generationsPercent >= 90
                  ? "bg-rose-500"
                  : generationsPercent >= 70
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e]"
              }`}
              style={{ width: `${generationsPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {remainingGens} generations left until next reset.
          </p>
        </div>

        {/* Character Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Characters Streamed</span>
            <span className="font-mono font-bold text-slate-900">
              {charsPercent}% ({quota.chars_used_today.toLocaleString()})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
          <p className="text-[11px] text-slate-500">
            {remainingChars.toLocaleString()} chars available from 10M daily cap.
          </p>
        </div>

        {/* Daily Reset Info Box */}
        <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-200/80">
          <p className="text-xs text-orange-950 leading-relaxed">
            💡 All daily limits reset automatically every morning at{" "}
            <strong>{formatResetTime(quota.reset_at)}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
