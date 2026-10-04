"use client";

import React, { useState, useEffect } from "react";
import { FiSettings, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

import SettingsHeader from "./components/SettingsHeader";
import SettingsStats from "./components/SettingsStats";
import ProfileCard from "./components/ProfileCard";
import UsageCard from "./components/UsageCard";
import CreditHistoryCard from "./components/CreditHistoryCard";
import TopUpModal from "@/app/components/TopUpModal";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  google_id: string;
  available_credits?: number;
  tier?: string;
  created_at: string;
  updated_at: string;
}

interface UserQuota {
  generations_used: number;
  max_daily_generations: number;
  max_chars_per_request: number;
  chars_used_today: number;
  max_daily_chars: number;
  reset_at: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [totalTemplates, setTotalTemplates] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Edit display name state
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setQuota(data.quota ?? null);
        setTotalTemplates(data.total_templates ?? 0);
        setDisplayName(data.user.name || "");
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setQuota(null);
        setTotalTemplates(0);
      }
    } catch (err: any) {
      setError("Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Listen for global credit update and top-up events
  useEffect(() => {
    const handleCreditsUpdated = (e: any) => {
      if (user && e.detail?.credits !== undefined) {
        setUser((prev) => (prev ? { ...prev, available_credits: e.detail.credits } : prev));
      }
      fetchSettings();
    };

    const handleOpenTopUp = () => setIsTopUpOpen(true);

    window.addEventListener("credits-updated", handleCreditsUpdated);
    window.addEventListener("open-topup-modal", handleOpenTopUp);

    return () => {
      window.removeEventListener("credits-updated", handleCreditsUpdated);
      window.removeEventListener("open-topup-modal", handleOpenTopUp);
    };
  }, [user]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setUser((prev) => (prev ? { ...prev, name: data.user.name } : prev));
      setSaveStatus("success");
      setSaveMessage("Display name updated successfully!");
    } catch (err: any) {
      setSaveStatus("error");
      setSaveMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-3">
        <FiRefreshCw className="w-8 h-8 text-[#ff7d6e] animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading account settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-between p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 shadow-xs">
        <div className="flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          onClick={fetchSettings}
          className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="w-full max-w-xl mx-auto mt-16 p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-center space-y-5">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-[#ff7d6e]">
          <FiSettings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in Required</h1>
          <p className="text-slate-500 text-sm mt-1">
            Please connect your Google account to view profile settings, usage quotas, and manage your wallet credits.
          </p>
        </div>
        <a
          href="/api/auth/google"
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#ff7d6e] hover:bg-[#e04836] text-white rounded-xl font-semibold transition-all shadow-xs cursor-pointer"
        >
          <FaGoogle className="text-sm" />
          Sign in with Google
        </a>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* 1. Header */}
      <SettingsHeader onRefresh={fetchSettings} isLoading={isLoading} />

      {/* 2. Top Overview Stat Cards */}
      <SettingsStats
        quota={quota}
        totalTemplates={totalTemplates}
        availableCredits={user.available_credits ?? 50}
        tier={user.tier ?? "free"}
        onTopUpClick={() => setIsTopUpOpen(true)}
      />

      {/* 3. Main Split Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile Card (2 cols) */}
        <div className="lg:col-span-2">
          <ProfileCard
            user={user}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onSaveName={handleSaveName}
            isSaving={isSaving}
            saveStatus={saveStatus}
            saveMessage={saveMessage}
          />
        </div>

        {/* Right Column: Usage Breakdown (1 col) */}
        <div className="lg:col-span-1">
          <UsageCard quota={quota} />
        </div>
      </div>

      {/* 4. Full-width Credit Ledger & Transaction History Card */}
      <CreditHistoryCard
        currentCredits={user.available_credits ?? 50}
        currentTier={user.tier ?? "free"}
        onTopUpClick={() => setIsTopUpOpen(true)}
      />

      {/* 5. Top-Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentCredits={user.available_credits ?? 50}
        currentTier={user.tier ?? "free"}
        onSuccess={(newBalance) => {
          setUser((prev) => (prev ? { ...prev, available_credits: newBalance } : prev));
          fetchSettings();
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
