'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FaTimes,
  FaCoins,
  FaCheck,
  FaBolt,
  FaShieldAlt,
  FaCrown,
  FaCreditCard,
  FaMobileAlt,
} from 'react-icons/fa';
import { TOPUP_PACKAGES } from '@/app/lib/payments/payfast';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
  currentTier?: string;
  onSuccess?: (newBalance: number) => void;
}

export default function TopUpModal({
  isOpen,
  onClose,
  currentCredits = 50,
  currentTier = 'free',
  onSuccess,
}: TopUpModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<'starter' | 'pro'>('starter');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLiveEnvironment, setIsLiveEnvironment] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsLiveEnvironment(hostname !== 'localhost' && hostname !== '127.0.0.1');
    }
  }, []);

  if (!isOpen || !mounted) return null;

  const handleCheckout = async (simulate: boolean = false) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage,
          simulateSuccess: simulate || process.env.NODE_ENV !== 'production',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate checkout.');
      }

      if (data.status === 'success') {
        setSuccessMessage(data.message || 'Wallet topped up successfully!');
        if (onSuccess && data.newBalance !== undefined) {
          onSuccess(data.newBalance);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else if (data.checkoutUrl) {
        // Redirect to PayFast payment gateway
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  const starterPkg = TOPUP_PACKAGES.starter;
  const proPkg = TOPUP_PACKAGES.pro;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff9b8f] to-[#ff7d6e] flex items-center justify-center text-white shadow-xs">
              <FaCoins className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Top-Up Wallet Credits</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-950 border border-orange-200">
                  {currentTier.toUpperCase()} TIER
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pay-As-You-Go • Credits have <strong>NO expiry date</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
              <FaCoins className="text-amber-500" />
              <span>{currentCredits} Credits</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Notification Messages */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <FaCheck className="text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
              <FaTimes className="text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Package Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Starter Package ($10) */}
            <div
              onClick={() => setSelectedPackage('starter')}
              className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedPackage === 'starter'
                  ? 'border-[#ff7d6e] bg-orange-50/20 shadow-md ring-2 ring-[#ff7d6e]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {starterPkg.name}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPackage === 'starter'
                        ? 'border-[#ff7d6e] bg-[#ff7d6e] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedPackage === 'starter' && <FaCheck className="text-[9px]" />}
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-xl font-black text-slate-900">Pay-As-You-Go</span>
                </div>
                <div className="text-xs font-bold text-[#c83a2a] mb-4">
                  {starterPkg.credits} Non-expiring Credits
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  {starterPkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FaCheck className="text-emerald-500 text-[11px] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Credits never expire</span>
                <span className="font-bold text-slate-700">140 Full Reels</span>
              </div>
            </div>

            {/* 2. Pro Package ($30) */}
            <div
              onClick={() => setSelectedPackage('pro')}
              className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedPackage === 'pro'
                  ? 'border-[#ff7d6e] bg-orange-50/20 shadow-md ring-2 ring-[#ff7d6e]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <FaCrown className="text-[9px]" /> Best Value
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {proPkg.name}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPackage === 'pro'
                        ? 'border-[#ff7d6e] bg-[#ff7d6e] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedPackage === 'pro' && <FaCheck className="text-[9px]" />}
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-xl font-black text-slate-900">Pay-As-You-Go</span>
                </div>
                <div className="text-xs font-bold text-emerald-600 mb-4">
                  {proPkg.credits} Credits (+100 Bonus)
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  {proPkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FaCheck className="text-emerald-500 text-[11px] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>ElevenLabs Unlocked</span>
                <span className="font-bold text-slate-700">440 Full Reels</span>
              </div>
            </div>
          </div>

          {isLiveEnvironment ? (
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200/80 flex flex-col gap-1.5 text-xs text-rose-800">
              <div className="flex items-center gap-2 font-bold">
                <FaShieldAlt className="text-rose-600 text-sm" />
                <span>Payments Disabled (Testing Phase)</span>
              </div>
              <p className="pl-6">
                Payments are currently disabled during the public testing phase. If you need more credits to test the app, you can request them by emailing <a href="mailto:bilalahmed_bhabma@outlook.com" className="font-bold underline">bilalahmed_bhabma@outlook.com</a>.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-2 text-xs text-slate-500">
              <FaShieldAlt className="text-emerald-600 text-sm" />
              <span>Secure checkout. Credits are added to your wallet right after payment.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer self-start sm:self-center"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {!isLiveEnvironment && (
              <button
                type="button"
                onClick={() => handleCheckout(true)}
                disabled={isLoading}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                title="Test immediate wallet credit without paying real money"
              >
                <FaBolt className="text-emerald-500 text-[10px]" />
                <span>⚡ Test Sandbox Top-Up</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCheckout(false)}
              disabled={isLoading || isLiveEnvironment}
              className="px-5 py-2.5 bg-[#ff7d6e] hover:bg-[#e04836] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <FaBolt />
                  <span>
                    {isLiveEnvironment ? "Disabled in Beta" : `Get ${selectedPackage === 'starter' ? starterPkg.name : proPkg.name}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
