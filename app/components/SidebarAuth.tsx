"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaSignOutAlt, FaUserCircle, FaBolt, FaUser, FaCoins, FaCrown } from "react-icons/fa";
import { DbUser } from "../lib/db/types";
import { isDatabaseEnabled } from "../lib/config";
import Link from "next/link";
import TopUpModal from "./TopUpModal";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function SidebarAuth() {
  const [user, setUser] = useState<DbUser | null>(null);
  const [quota, setQuota] = useState<any | null>(null);
  const [credits, setCredits] = useState<number>(50);
  const [tier, setTier] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [dbEnabled, setDbEnabled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isEnabled = isDatabaseEnabled();
    setDbEnabled(isEnabled);

    if (!isEnabled) {
      setLoading(false);
      return;
    }
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setQuota(data.quota);
        setCredits(data.user.available_credits ?? 50);
        setTier(data.user.tier ?? "free");
      } else {
        setUser(null);
        setQuota(null);
      }
    } catch {
      setUser(null);
      setQuota(null);
    } finally {
      setLoading(false);
    }
  };

  // Global listeners for top-up triggers and credit updates
  useEffect(() => {
    const handleOpenTopUp = () => setTopUpOpen(true);
    const handleCreditsUpdated = (e: any) => {
      if (e.detail?.credits !== undefined) {
        setCredits(e.detail.credits);
      }
      if (e.detail?.tier) {
        setTier(e.detail.tier);
      }
      fetchSession();
    };

    window.addEventListener("open-topup-modal", handleOpenTopUp);
    window.addEventListener("credits-updated", handleCreditsUpdated);

    return () => {
      window.removeEventListener("open-topup-modal", handleOpenTopUp);
      window.removeEventListener("credits-updated", handleCreditsUpdated);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setUser(null);
      setQuota(null);
      setMenuOpen(false);
      window.location.reload();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!dbEnabled) {
    return (
      <div className="p-4 border-t border-slate-200">
        <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-center gap-1.5">
          <FaBolt className="text-emerald-500 w-5 h-5" />
          <span className="text-xs font-semibold text-slate-700">Offline Mode</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 border-t border-slate-200">
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-xs text-sm"
        >
          <GoogleIcon />
          <span>Login with Google</span>
        </a>
      </div>
    );
  }

  return (
    <div className="relative p-3.5 border-t border-slate-200/80 bg-slate-50/60" ref={menuRef}>

      {/* 2. Dropdown Menu on Profile Click */}
      {menuOpen && (
        <div className="absolute bottom-full left-3.5 right-3.5 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name || "User"}</p>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100/90 text-orange-900 border border-orange-200">
                {tier}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>

          <div className="p-3.5 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <FaCoins className="text-amber-500" />
                Available Credits
              </span>
              <span className="font-bold text-slate-900 font-mono">{credits.toLocaleString()}</span>
            </div>

            <div className="text-[10px] text-slate-500 bg-orange-50/60 p-2 rounded-xl border border-orange-100">
              ⚡ Pay-As-You-Go: 1 credit / caption, 2 credits / voiceover, 1 credit / social post.
            </div>

            <button
              onClick={() => {
                setMenuOpen(false);
                setTopUpOpen(true);
              }}
              className="w-full py-2 px-3 bg-[#ff7d6e] hover:bg-[#e04836] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FaBolt className="text-xs" />
              <span>Top-Up Balance</span>
            </button>
          </div>

          <div className="p-1.5">
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-orange-50/60 hover:text-[#c83a2a] rounded-xl transition-colors font-semibold"
            >
              <FaUser className="w-3.5 h-3.5" />
              <span>View Profile &amp; Billing</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold cursor-pointer"
            >
              <FaSignOutAlt className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. User Avatar Row */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2.5 w-full p-1.5 rounded-xl hover:bg-white/80 transition-colors text-left cursor-pointer"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#ff7d6e] flex items-center justify-center border border-orange-200">
            <FaUserCircle className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">
            {user.name || "User Account"}
          </p>
          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
        </div>
      </button>

      {/* 4. Top-Up Modal (Embeded and accessible globally) */}
      <TopUpModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        currentCredits={credits}
        currentTier={tier}
        onSuccess={(newBalance) => {
          setCredits(newBalance);
          fetchSession();
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("credits-updated", { detail: { credits: newBalance } })
            );
          }
        }}
      />
    </div>
  );
}
