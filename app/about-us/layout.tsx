import { Metadata } from "next";
import React from 'react';
import LandingNavbar from "@/app/landing/components/LandingNavbar";
import LandingFooter from "@/app/landing/components/LandingFooter";

export const metadata: Metadata = {
  title: 'About Us | Free AI Voice Generator',
  description: 'Learn about the mission and technology behind our free AI voice generator. We are dedicated to making high-quality, natural-sounding text-to-speech accessible for everyone.',
};

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-[#ff7d6e]/20 selection:text-[#c83a2a]">
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-5 pb-5 sm:pt-10 sm:pb-10">
          <div className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl border border-slate-200/80 shadow-xs">
            {children}
          </div>
        </main>
      </div>
      <LandingFooter />
    </>
  );
}
