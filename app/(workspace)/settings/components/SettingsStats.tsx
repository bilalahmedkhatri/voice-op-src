import React from "react";
import { FiZap, FiBarChart2, FiLayers, FiDatabase } from "react-icons/fi";
import { FaCoins, FaCrown, FaBolt } from "react-icons/fa";

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
  availableCredits?: number;
  tier?: string;
  onTopUpClick?: () => void;
}

export default function SettingsStats({
  quota,
  totalTemplates,
  availableCredits = 50,
  tier = "free",
  onTopUpClick,
}: SettingsStatsProps) {
  const generationsPercent = quota
    ? Math.min(100, Math.round((quota.generations_used / quota.max_daily_generations) * 100))
    : 0;

  const remainingGens = quota ? Math.max(0, quota.max_daily_generations - quota.generations_used) : 0;

  const getTierMeta = (t: string) => {
    switch (t.toLowerCase()) {
      case "pro":
        return { label: "Pro Creator", limit: "10 Meta Accounts • ElevenLabs Unlocked" };
      case "starter":
        return { label: "Starter Studio", limit: "3 Meta Accounts • Standard Automation" };
      default:
        return { label: "Free Tier", limit: "1 Meta Account • 50 Free Credits" };
    }
  };

  const tierMeta = getTierMeta(tier);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Wallet Credits */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Wallet Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-amber-500 flex items-center justify-center">
              <FaCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {availableCredits.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">Credits</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Pay-As-You-Go • No expiration</p>
        </div>

        {onTopUpClick && (
          <button
            type="button"
            onClick={onTopUpClick}
            className="mt-3 w-full py-1.5 px-3 bg-[#ff7d6e] hover:bg-[#e04836] text-white text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FaBolt className="text-[10px]" />
            <span>+ Top-Up Balance</span>
          </button>
        )}
      </div>

      {/* Card 2: Tier & Account Limit */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Plan Level
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FaCrown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 uppercase">
              {tier}
            </span>
            <span className="text-xs text-slate-500 font-medium">{tierMeta.label}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
          {tierMeta.limit}
        </p>
      </div>

      {/* Card 3: Daily Generations */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Daily Generations
          </span>
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center">
            <FiZap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {quota ? quota.generations_used : 0}
          </span>
          <span className="text-sm text-slate-400 font-mono">
            / {quota ? quota.max_daily_generations : 100}
          </span>
        </div>
        <div className="mt-3">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                generationsPercent >= 90
                  ? "bg-rose-500"
                  : generationsPercent >= 70
                  ? "bg-amber-500"
                  : "bg-[#ff7d6e]"
              }`}
              style={{ width: `${generationsPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            {remainingGens} generations left today
          </p>
        </div>
      </div>

      {/* Card 4: Saved Templates */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Saved Templates
          </span>
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center">
            <FiDatabase className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 font-mono">{totalTemplates}</span>
          <span className="text-sm text-slate-400">templates</span>
        </div>
        <p className="mt-4 text-xs text-slate-500 font-medium">
          Stored in your private database
        </p>
      </div>
    </div>
  );
}
