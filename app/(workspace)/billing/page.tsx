"use client";

import React, { useState, useEffect } from "react";
import {
  FaCoins,
  FaBolt,
  FaCrown,
  FaCheck,
  FaShieldAlt,
  FaCreditCard,
  FaMobileAlt,
  FaHistory,
  FaRegLightbulb,
} from "react-icons/fa";
import { FiRefreshCw, FiZap, FiLayers, FiCheckCircle } from "react-icons/fi";
import TopUpModal from "@/app/components/TopUpModal";
import CreditHistoryCard from "../settings/components/CreditHistoryCard";
import { TOPUP_PACKAGES } from "@/app/lib/payments/payfast";

export default function BillingPage() {
  const [wallet, setWallet] = useState<{
    available_credits: number;
    tier: string;
    total_deposited: number;
    total_spent: number;
  }>({
    available_credits: 50,
    tier: "free",
    total_deposited: 50,
    total_spent: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchBilling = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/billing/history");
      const data = await res.json();
      if (data.authenticated) {
        setWallet({
          available_credits: data.available_credits ?? 50,
          tier: data.tier ?? "free",
          total_deposited: data.total_deposited ?? 50,
          total_spent: data.total_spent ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to load billing details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();

    // Check if user returned from payment with ?topup=success
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("topup") === "success") {
        setShowCelebration(true);
      }
    }
  }, []);

  // Listen for global credits-updated event
  useEffect(() => {
    const handleCreditsUpdated = (e: any) => {
      if (e.detail?.credits !== undefined) {
        setWallet((prev) => ({ ...prev, available_credits: e.detail.credits }));
      }
      fetchBilling();
    };

    window.addEventListener("credits-updated", handleCreditsUpdated);
    return () => window.removeEventListener("credits-updated", handleCreditsUpdated);
  }, []);

  const starterPkg = TOPUP_PACKAGES.starter;
  const proPkg = TOPUP_PACKAGES.pro;

  return (
    <div className="w-full space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* 1. Header & Quick Wallet Balance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#ff9b8f] to-[#ff7d6e] flex items-center justify-center text-white shadow-xs">
              <FaCoins className="text-base" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Pricing &amp; Wallet Management
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Pay-As-You-Go Credits • No Monthly Subscriptions • Credits Never Expire
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <FaCoins className="text-amber-500 text-sm" />
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-base font-extrabold text-slate-900">
                {wallet.available_credits.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Credits</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-950 border border-orange-200 ml-1">
              {wallet.tier}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="px-4 py-2 bg-[#ff7d6e] hover:bg-[#e04836] text-white text-xs font-bold rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FaBolt />
            <span>+ Top-Up Balance</span>
          </button>
        </div>
      </div>

      {/* 2. Celebration Notification (if returning from payment) */}
      {showCelebration && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <FiCheckCircle className="text-emerald-500 text-base" />
            <span>
              🎉 Payment Successful! Your credits have been credited and your wallet is now updated.
            </span>
          </div>
          <button
            onClick={() => setShowCelebration(false)}
            className="text-emerald-700 hover:text-emerald-950 underline font-semibold text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}


      {/* 5. Complete Transaction Ledger */}
      <CreditHistoryCard
        currentCredits={wallet.available_credits}
        currentTier={wallet.tier}
        onTopUpClick={() => setIsTopUpOpen(true)}
      />

      {/* 6. Top-Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentCredits={wallet.available_credits}
        currentTier={wallet.tier}
        onSuccess={(newBalance) => {
          setWallet((prev) => ({ ...prev, available_credits: newBalance }));
          fetchBilling();
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
