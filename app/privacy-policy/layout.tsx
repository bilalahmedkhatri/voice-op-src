import { Metadata } from "next";
import React from 'react';
import BackButton from "../components/BackButton";
import Footer from "../Footer";

export const metadata: Metadata = {
  title: 'Privacy Policy | Free AI Voice Generator',
  description: 'Read the privacy policy for our free AI voice generator. Understand how we collect, use, and protect your data when you use our text-to-speech service.',
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 font-sans">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 md:py-16">
        <BackButton />
        <div className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl border border-slate-200/80 shadow-xs">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
