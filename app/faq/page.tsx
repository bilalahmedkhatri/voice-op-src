import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | GenZee Video',
  description:
    'Find answers to common questions about GenZee Video, AI voice synthesis (ElevenLabs, Gemini, Fish Audio), Facebook/Instagram social scheduling, and monetization licensing.',
  alternates: {
    canonical: 'https://genzee.video/faq',
  },
};

const faqs = [
  {
    q: 'What is GenZee Video (genzee.video)?',
    a: 'GenZee Video is an all-in-one AI content studio for creators, agencies, and marketers. It combines multi-model AI voiceover synthesis (ElevenLabs, Fish Audio & Gemini) with automated Facebook and Instagram publishing, YouTube content strategy generation, and structured JSON campaign orchestration.',
  },
  {
    q: 'How does Facebook and Instagram automation work in GenZee?',
    a: 'You can securely connect your Facebook Pages and linked Instagram Business accounts. GenZee lets you draft posts and Reels, preview them in realistic desktop and mobile feeds, and publish or schedule them directly to your channels with 1-click publishing.',
  },
  {
    q: 'What is the JSON Strategy Generator?',
    a: 'You can prompt any AI (like ChatGPT, Claude, or DeepSeek) to generate a multi-week content plan, paste the JSON into GenZee, and instantly view interactive daily schedules, scripts, and video hooks with 1-click voice synthesis.',
  },
  {
    q: 'Is GenZee free to use?',
    a: 'Yes! GenZee offers a Free Studio Plan with daily voice generations, local browser IndexedDB storage, and social scheduling tools.',
  },
  {
    q: 'What audio formats can I download?',
    a: 'You can download the generated voiceovers in uncompressed, studio-grade WAV format, ready for editing in Premiere Pro, CapCut, DaVinci Resolve, or Final Cut Pro.',
  },
  {
    q: 'Can I use the generated voiceovers for YouTube and commercial monetization?',
    a: 'Yes, audio synthesized with ElevenLabs, Fish Audio & Google Gemini models is fully compatible with YouTube monetization, podcasts, and commercial video production.',
  },
];

export default function FaqContent() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-500">
          Everything you need to know about GenZee Video and our content automation studio.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-2 hover:border-slate-300 transition-colors"
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {faq.q}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}