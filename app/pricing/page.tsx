import React from "react";
import type { Metadata } from "next";
import LandingNavbar from "@/app/landing/components/LandingNavbar";
import LandingFooter from "@/app/landing/components/LandingFooter";
import { TOPUP_PACKAGES } from "@/app/lib/payments/payfast";
import {
  FaBolt,
  FaCrown,
  FaCheck,
  FaShieldAlt,
  FaRegLightbulb,
  FaMicrophoneAlt,
  FaCalendarAlt,
  FaMagic,
  FaInfinity,
  FaLayerGroup,
  FaHeadset,
} from "react-icons/fa";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Pay-As-You-Go AI Voice & Social Publishing Credits | GenZee Video",
  description:
    "Simple pay-as-you-go credits for AI voiceovers, captions and Facebook and Instagram Reel scheduling. No monthly subscription, credits never expire. Start free with 50 credits.",
  alternates: {
    canonical: "https://www.genzee.video/pricing",
  },
};

const featureGuide = [
  {
    icon: FaMicrophoneAlt,
    title: "AI Voiceover Studio",
    text: "Turn any script into a natural voiceover. Standard voices use Google Gemini and Fish Audio. Premium voices use ElevenLabs for the most expressive, documentary-style narration. Download studio-grade WAV files for any editor.",
  },
  {
    icon: FaMagic,
    title: "Captions and Hashtags",
    text: "Paste an idea and get a ready-to-post caption with relevant hashtags. Great for keeping your posting voice consistent across Facebook, Instagram and YouTube.",
  },
  {
    icon: FaCalendarAlt,
    title: "1-Click Social Publishing",
    text: "Connect your Facebook Pages and Instagram Business accounts, preview your Reel in a realistic feed, then publish now or schedule up to 75 days ahead.",
  },
  {
    icon: FaBolt,
    title: "Full 1-Click Automation",
    text: "Go from a single idea to a scheduled Reel. GenZee writes the caption, creates the voiceover and queues the post in one step, so a whole week of content takes minutes.",
  },
  {
    icon: FaLayerGroup,
    title: "Content Strategy Planner",
    text: "Import a multi-week plan from any AI assistant and see it as an interactive calendar with daily scripts, hooks and voiceovers ready to generate.",
  },
  {
    icon: FaInfinity,
    title: "Credits That Never Expire",
    text: "Top up once and use your credits whenever you need them. There is no monthly reset, no lock-in and no penalty for taking a quiet month.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Start with free credits",
    text: "Every new account gets 50 free credits, enough to create around 10 full automated Reels and try the whole studio.",
  },
  {
    step: "2",
    title: "Use credits per action",
    text: "Each action uses a small, fixed number of credits shown in the table below. You always know what an action will use before you run it.",
  },
  {
    step: "3",
    title: "Top up only when needed",
    text: "When your balance runs low, add a Starter or Pro top-up. Credits are added instantly and stay in your wallet until you use them.",
  },
];

const faqs = [
  {
    q: "Do I need a monthly subscription?",
    a: "No. GenZee works on pay-as-you-go credits. You only top up when you need more and nothing renews automatically.",
  },
  {
    q: "Do my credits expire?",
    a: "No. Credits stay in your wallet until you use them, even if you do not log in for months.",
  },
  {
    q: "What does a full automated Reel include?",
    a: "A caption with hashtags, an AI voiceover and automatic scheduling to your connected Facebook or Instagram account, all in a single step.",
  },
  {
    q: "What happens if a generation fails?",
    a: "If a generation fails because of a technical problem on our side, the credits are returned to your wallet automatically.",
  },
  {
    q: "What is the difference between Starter and Pro?",
    a: "Starter gives you standard Gemini and Fish Audio voices and up to 3 linked accounts. Pro adds premium ElevenLabs voices, up to 10 linked accounts, bulk scheduling and priority rendering, plus bonus credits.",
  },
  {
    q: "Can I use the audio for monetized videos?",
    a: "Yes. Audio created with paid credits can be used in YouTube videos, podcasts, ads and social content, subject to our Terms of Service.",
  },
];

const creditTable = [
  { action: "Caption and Hashtags", credits: "1 Credit", note: "AI-written caption with matching hashtags" },
  { action: "Standard Voiceover", credits: "2 Credits", note: "Google Gemini or Fish Audio voices" },
  { action: "Premium Voiceover", credits: "4 Credits", note: "ElevenLabs studio voices" },
  { action: "Post or Reel Scheduling", credits: "1 Credit", note: "Publish or schedule to Facebook and Instagram" },
  { action: "Full 1-Click Automation", credits: "5 Credits", note: "Caption, voiceover and scheduling in one step", highlight: true },
];

const comparison: { feature: string; free: string; starter: string; pro: string }[] = [
  { feature: "Credits included", free: "50 on sign-up", starter: "700", pro: "2,200 (with bonus)" },
  { feature: "Standard voices (Gemini, Fish Audio)", free: "Yes", starter: "Yes", pro: "Yes" },
  { feature: "Premium ElevenLabs voices", free: "No", starter: "No", pro: "Yes" },
  { feature: "Linked Facebook and Instagram accounts", free: "1", starter: "Up to 3", pro: "Up to 10" },
  { feature: "Schedule ahead", free: "Standard", starter: "Up to 75 days", pro: "Up to 75 days" },
  { feature: "Bulk scheduling", free: "No", starter: "No", pro: "Yes" },
  { feature: "Priority rendering", free: "No", starter: "No", pro: "Yes" },
  { feature: "Credits expire", free: "Never", starter: "Never", pro: "Never" },
];

export default function PricingPage() {
  const starterPkg = TOPUP_PACKAGES.starter;
  const proPkg = TOPUP_PACKAGES.pro;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#ff7d6e]/20 selection:text-[#c83a2a] pt-24 pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* Header */}
          <header className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-slate-600">
              Pay only for what you create. Start free, top up when you need more, and keep your
              credits for as long as you like.
            </p>
          </header>

          {/* Pricing Grid */}
          <section aria-label="Plans" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Welcome */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Welcome Plan</h2>
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Included
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900">Pay-As-You-Go</span>
                </div>
                <p className="text-sm font-bold text-[#c83a2a] mb-6">50 Free Credits on Sign-up</p>
                <ul className="space-y-3.5 text-sm text-slate-600 mb-8">
                  {[
                    "Enough for about 10 full automated Reels",
                    "Standard Gemini and Fish Audio voices",
                    "Link 1 Facebook or Instagram page",
                    "Standard scheduling",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <FaCheck className="text-emerald-500 text-sm shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <Link
                  href="/admin"
                  className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Start for Free
                </Link>
              </div>
            </div>

            {/* Starter */}
            <div className="bg-white border-2 border-slate-200 hover:border-[#ff7d6e] rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative md:-translate-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{starterPkg.name}</h2>
                  <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-orange-100 text-orange-950 border border-orange-200">
                    Popular
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900">Pay-As-You-Go</span>
                </div>
                <p className="text-sm font-bold text-[#c83a2a] mb-6">{starterPkg.credits} Non-expiring Credits</p>
                <ul className="space-y-3.5 text-sm text-slate-600 mb-8">
                  {starterPkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <FaCheck className="text-emerald-500 text-sm shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <Link
                  href="/admin"
                  className="w-full py-3.5 px-4 bg-[#ff7d6e] hover:bg-[#e04836] text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <FaBolt />
                  <span>Get {starterPkg.name}</span>
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-orange-50/40 via-white to-white border-2 border-[#ff7d6e] rounded-3xl p-8 shadow-lg flex flex-col justify-between relative ring-4 ring-[#ff7d6e]/10">
              <div className="absolute -top-4 right-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                <FaCrown className="text-xs" /> Best Value
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{proPkg.name}</h2>
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-200">
                    +100 Bonus
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900">Pay-As-You-Go</span>
                </div>
                <p className="text-sm font-bold text-emerald-600 mb-6">{proPkg.credits} Non-expiring Credits</p>
                <ul className="space-y-3.5 text-sm text-slate-600 mb-8">
                  {proPkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <FaCheck className="text-emerald-500 text-sm shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <Link
                  href="/admin"
                  className="w-full py-3.5 px-4 bg-[#ff7d6e] hover:bg-[#e04836] text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <FaCrown />
                  <span>Get {proPkg.name}</span>
                </Link>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section aria-labelledby="how-credits-work" className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 id="how-credits-work" className="text-3xl font-black tracking-tight text-slate-900">
                How Credits Work
              </h2>
              <p className="text-slate-600">Three simple steps. No surprises, no hidden fees.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {howItWorks.map((s) => (
                <div key={s.step} className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff9b8f] to-[#ff7d6e] text-white font-black flex items-center justify-center">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Feature guide */}
          <section aria-labelledby="whats-included" className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 id="whats-included" className="text-3xl font-black tracking-tight text-slate-900">
                What You Get With Every Plan
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                A closer look at the tools your credits unlock inside the GenZee studio.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureGuide.map((f) => (
                <article
                  key={f.title}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#ff7d6e]/10 text-[#c83a2a] flex items-center justify-center">
                    <f.icon />
                  </div>
                  <h3 className="font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Credit usage */}
          <section
            aria-labelledby="credit-usage"
            className="max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3">
              <FaRegLightbulb className="text-[#ff7d6e] text-xl" />
              <h2 id="credit-usage" className="text-lg font-bold text-slate-900 uppercase tracking-wider">
                Credit Usage Guide
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-4">Action</th>
                    <th className="pb-4">Credits Used</th>
                    <th className="pb-4">What You Get</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {creditTable.map((r) => (
                    <tr key={r.action}>
                      <td className="py-4 font-semibold text-slate-800">{r.action}</td>
                      <td
                        className={`py-4 font-mono font-bold ${r.highlight ? "text-[#c83a2a]" : "text-slate-900"}`}
                      >
                        {r.credits}
                      </td>
                      <td className="py-4 text-slate-600">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-6 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
              <FaShieldAlt className="text-emerald-600 text-lg shrink-0" />
              <span>Secure checkout. Credits are added to your wallet right after payment.</span>
            </div>
          </section>

          {/* Plan comparison */}
          <section aria-labelledby="compare-plans" className="max-w-5xl mx-auto space-y-6">
            <h2 id="compare-plans" className="text-3xl font-black tracking-tight text-slate-900 text-center">
              Compare Plans
            </h2>
            <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Feature</th>
                    <th className="p-4">Welcome</th>
                    <th className="p-4">Starter</th>
                    <th className="p-4 text-[#c83a2a]">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparison.map((r) => (
                    <tr key={r.feature} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{r.feature}</td>
                      <td className="p-4 text-slate-600">{r.free}</td>
                      <td className="p-4 text-slate-600">{r.starter}</td>
                      <td className="p-4 text-slate-900 font-medium">{r.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section aria-labelledby="pricing-faq" className="max-w-3xl mx-auto space-y-6">
            <h2 id="pricing-faq" className="text-3xl font-black tracking-tight text-slate-900 text-center">
              Pricing Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm open:shadow-md transition-all"
                >
                  <summary className="cursor-pointer font-bold text-slate-900 list-none flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-[#ff7d6e] text-xl leading-none group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
      </div>
      <LandingFooter />
    </>
  );
}
