"use client";

import { useState, type ReactNode } from "react";
import IdentityBoundary from "../components/IdentityBoundary";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";
import type { WalletBalance } from "../components/TopUpButton";
import { usePathname } from "next/navigation";
import { WorkspaceTitleContext, type WorkspaceTitle } from "../components/workspace/WorkspaceTitleContext";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [pageTitle, setPageTitle] = useState<WorkspaceTitle | null>(null);
  const pathname = usePathname();
  const closeSidebar = () => setIsMobileMenuOpen(false);

  return (
    <IdentityBoundary>
      <WorkspaceTitleContext.Provider value={setPageTitle}>
      <div className="flex h-screen bg-slate-50 font-sans">
        <WorkspaceSidebar isOpen={isMobileMenuOpen} onClose={closeSidebar} onWalletChange={setWallet} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <WorkspaceHeader isSidebarOpen={isMobileMenuOpen} onOpenSidebar={() => setIsMobileMenuOpen(true)} wallet={wallet}
            title={pageTitle?.pathname === pathname ? pageTitle.title : undefined} />
          <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
        </main>
      </div>
      </WorkspaceTitleContext.Provider>
    </IdentityBoundary>
  );
}
