import React from 'react';
import LandingNavbar from "@/app/landing/components/LandingNavbar";
import LandingFooter from "@/app/landing/components/LandingFooter";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-[#ff7d6e]/20 selection:text-[#c83a2a]">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-2 pb-2 sm:pt-2 sm:pb-2">
          {children}
        </main>
      </div>
      <LandingFooter />
    </>
  );
}