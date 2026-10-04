import React from 'react';
import type { Metadata } from 'next';
import LandingNavbar from './landing/components/LandingNavbar';
import LandingHero from './landing/components/LandingHero';
import LandingInteractiveStudio from './landing/components/LandingInteractiveStudio';
import InteractiveJsonPlayground from './showcase/components/InteractiveJsonPlayground';
import InteractiveSocialFeedSimulator from './showcase/components/InteractiveSocialFeedSimulator';
import LandingPipelineWorkflow from './landing/components/LandingPipelineWorkflow';
import LandingFeatureShowcase from './landing/components/LandingFeatureShowcase';
import LandingHonestSpecsGrid from './landing/components/LandingHonestSpecsGrid';
import LandingCreatorFaq from './landing/components/LandingCreatorFaq';
import LandingFooter from './landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'GenZee | AI Voice & Content Automation Studio',
  description:
    'Turn scripts into natural voiceovers, automate Facebook & Instagram Reels, brainstorm YouTube strategies, and orchestrate campaigns with multi-model AI.',
  alternates: {
    canonical: 'https://www.genzee.video',
  },
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GenZee Video Studio',
  url: 'https://www.genzee.video',
  image: 'https://www.genzee.video/og-image.png',
  description:
    'Turn scripts into natural voiceovers, automate Facebook & Instagram Reels, brainstorm YouTube strategies, and orchestrate campaigns with multi-model AI.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Multi-model text to speech conversion (ElevenLabs, Fish Audio and Google Gemini)',
    'Automated Facebook & Instagram Reels publishing and scheduling',
    'YouTube long-form and Shorts content strategy orchestration',
    'Prompt-to-JSON campaign management and live template editor',
  ],
};

export default function MasterLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#ff7d6e]/20 selection:text-[#c83a2a]">
      {/* SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      {/* 1. Sticky Navigation */}
      <LandingNavbar />

      <main>
        {/* 2. Editorial Hero Section with Direct CTA to /admin */}
        <LandingHero />

        {/* 3. Live Functional Speech Synthesis Playground (ElevenLabs, Google Gemini, Fish Audio) */}
        <LandingInteractiveStudio />

        {/* 4. Live Prompt-to-JSON Campaign Engine (Raw JSON + Interactive Parsed Calendar) */}
        <InteractiveJsonPlayground />

        {/* 5. Live Multi-Platform Social Feed Simulator (Facebook Feed, FB Reel, IG Reel) */}
        <InteractiveSocialFeedSimulator />

        {/* 6. 3-Step Autonomous Creator Pipeline */}
        <LandingPipelineWorkflow />

        {/* 7. Four Core Pillars Showcase (Voice, Social, YouTube, JSON) */}
        <LandingFeatureShowcase />

        {/* 8. Honest Technical Specifications Grid */}
        <LandingHonestSpecsGrid />

        {/* 9. Creator & Agency FAQ Accordion */}
        <LandingCreatorFaq />
      </main>

      {/* 10. Editorial Footer */}
      <LandingFooter />
    </div>
  );
}
