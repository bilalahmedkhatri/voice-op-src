'use client';

import React, { useState, useEffect } from 'react';
import {
  FaCoins,
  FaBolt,
  FaArrowUp,
  FaArrowDown,
  FaGift,
  FaHistory,
  FaCheckCircle,
} from 'react-icons/fa';

interface CreditLedgerItem {
  id: string;
  amount: number;
  balance_after: number;
  action_type: string;
  description: string;
  reference_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface CreditHistoryCardProps {
  currentCredits?: number;
  currentTier?: string;
  onTopUpClick: () => void;
}

export default function CreditHistoryCard({
  currentCredits = 50,
  currentTier = 'free',
  onTopUpClick,
}: CreditHistoryCardProps) {
  const [history, setHistory] = useState<CreditLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/credits');
      const data = await res.json();
      if (data.authenticated && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error('Failed to load credit history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentCredits]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center">
            <FaCoins className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Wallet &amp; Credit Ledger</h2>
            <p className="text-xs text-slate-500">Pay-As-You-Go balance • No expiration</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-1.5 font-mono">
            <FaCoins className="text-amber-500 text-xs" />
            <span>{currentCredits.toLocaleString()} Credits</span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-orange-100/80 text-orange-950">
              {currentTier}
            </span>
          </div>

          <button
            type="button"
            onClick={onTopUpClick}
            className="px-3 py-1.5 bg-[#ff7d6e] hover:bg-[#e04836] text-white text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <FaBolt className="text-[10px]" />
            <span>+ Top-Up</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FaHistory className="text-slate-400" />
            <span>Transaction History</span>
          </h3>
          <span className="text-xs text-slate-400">Recent 50 transactions</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Loading credit transactions...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200/60 p-4">
            <p className="text-xs font-semibold text-slate-600">No transactions recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Your welcome bonus and generation history will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">Action</th>
                  <th className="pb-2.5">Description</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-right">Balance</th>
                  <th className="pb-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => {
                  const isPositive = item.amount > 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                        {isPositive ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            {item.action_type === 'welcome_bonus' ? (
                              <FaGift className="text-[10px]" />
                            ) : (
                              <FaArrowUp className="text-[9px]" />
                            )}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <FaArrowDown className="text-[9px]" />
                          </div>
                        )}
                        <span className="capitalize">{item.action_type.replace(/_/g, ' ')}</span>
                      </td>

                      <td className="py-3 text-slate-600 max-w-xs truncate">
                        {item.description || 'System Ledger Adjustment'}
                      </td>

                      <td className="py-3 text-right font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600'
                              : 'text-slate-600'
                          }
                        >
                          {isPositive ? `+${item.amount}` : item.amount}
                        </span>
                      </td>

                      <td className="py-3 text-right font-mono text-slate-500">
                        {item.balance_after}
                      </td>

                      <td className="py-3 text-right text-slate-400 font-mono text-[11px]">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
