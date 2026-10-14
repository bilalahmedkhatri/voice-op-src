"use client";

import { FiMenu } from "react-icons/fi";
import { TopUpButton, type WalletBalance } from "../TopUpButton";
import { usePathname } from "next/navigation";

const routeTitles: Record<string, string> = {
  "/admin": "GenZee Voice Studio", "/audio-library": "GenZee Audio Library",
  "/billing": "Pricing & Wallet Management", "/templates": "Saved Templates",
  "/settings": "Account & Settings", "/json-generator": "Dynamic Template Generator",
  "/youtube/templates": "YouTube Strategies", "/facebook/templates": "Facebook Content Plans",
  "/facebook/integration": "Facebook & Instagram Studio",
  "/youtube/content": "YouTube Content Strategy", "/youtube/content/detail": "Video Details",
  "/facebook/content": "Facebook Content Plan", "/facebook/content/detail": "Post Details",
  "/content": "Content Strategy", "/content/detail": "Content Details",
};

export default function WorkspaceHeader({ isSidebarOpen, onOpenSidebar, wallet, title }: {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  wallet: WalletBalance | null;
  title?: string;
}) {
  const pathname = usePathname();
  const pageTitle = title || routeTitles[pathname] || "Studio";
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 min-h-16 px-4 md:px-8 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" aria-label="Open sidebar" aria-expanded={isSidebarOpen} aria-controls="workspace-sidebar"
          onClick={onOpenSidebar} className="md:hidden shrink-0 text-slate-500 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-[#ff9b8f] rounded-md">
          <FiMenu className="w-6 h-6" />
        </button>
        <span data-workspace-title title={pageTitle} className="truncate font-bold text-slate-900 text-sm">{pageTitle}</span>
      </div>
      <div aria-label="Wallet balance" aria-live="polite" className="shrink-0">
        <TopUpButton availableCredits={wallet?.credits?.toLocaleString() ?? "—"} userTier={wallet?.tier} disabled={!wallet || wallet.credits === null} />
      </div>
    </header>
  );
}
