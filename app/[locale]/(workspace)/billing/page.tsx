"use client";

import {useCopy} from '@/i18n/copy';

import WorkspacePageHeader from "@/app/components/workspace/WorkspacePageHeader";


import { ownerFetch as fetch } from '@/app/lib/ownerStorage';

import React, { useState, useEffect } from "react";
import {
  FaCoins,
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
  const copy = useCopy();


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

  return (
    <div className="w-full space-y-6 mx-auto animate-in fade-in duration-300">
      {/* 2. Celebration Notification (if returning from payment) */}
      {showCelebration && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <FiCheckCircle className="text-emerald-500 text-base" />
            <span>
              {copy("🎉 Payment Successful! Your credits have been credited and your wallet is now updated.")}</span>
          </div>
          <button
            onClick={() => setShowCelebration(false)}
            className="text-emerald-700 hover:text-emerald-950 underline font-semibold text-xs cursor-pointer"
          >
            {copy("Dismiss")}</button>
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
