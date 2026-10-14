
import { FiZap } from "react-icons/fi";
import { FC } from "react";

interface TopUpButtonProps {
  availableCredits?: number | string;
  userTier?: string;
  disabled?: boolean;
}

export interface WalletBalance { credits: number | null; tier: string; }

export const TopUpButton: FC<TopUpButtonProps> = ({ availableCredits, userTier, disabled = false }) => {
    return (
        <div>
            <div className="flex items-center gap-2">
                <div className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-2 bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    <span className="text-amber-500 font-bold flex items-center gap-1 font-mono">
                        🪙 {availableCredits}
                    </span>
                    <span className="text-slate-400">Credits</span>
                    {userTier && <span className="hidden sm:inline text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-orange-50 text-[#c83a2a]">
                        {userTier}
                    </span>}
                </div>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('open-topup-modal'));
                        }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#ff7d6e] hover:bg-[#e04836] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Top-Up Wallet Credits"
                >
                    <FiZap className="w-3 h-3" />
                    <span>+ Top Up</span>
                </button>
            </div>
        </div>
    );
}

