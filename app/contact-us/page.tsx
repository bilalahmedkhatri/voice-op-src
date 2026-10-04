import React from 'react';
import Link from 'next/link';

const topics = [
  {
    title: 'Product Support',
    text: 'Help with AI voice generation, credits and wallet top-ups, audio downloads, or connecting your Facebook and Instagram accounts.',
  },
  {
    title: 'Billing & Credits',
    text: 'Questions about Pay-As-You-Go credit purchases, receipts, failed transactions or credit refunds for failed generations.',
  },
  {
    title: 'Agency & Business',
    text: 'Managing multiple channels, bulk voiceover workflows, custom needs for agencies and marketing teams.',
  },
  {
    title: 'Partnerships & Press',
    text: 'Collaboration, affiliate and media enquiries about GenZee Video and our AI content studio.',
  },
  {
    title: 'Feedback & Feature Requests',
    text: 'Tell us which voices, languages or publishing features you want next. Your ideas shape our roadmap.',
  },
];

export default function ContactUs() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center">
          Contact GenZee Video Support
        </h1>
        <p className="text-center text-slate-500 max-w-2xl mx-auto">
          We&apos;d love to hear from you! Whether you have a question about our AI voice generator, a suggestion for
          the social scheduler, or a business inquiry, our team is here to help.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 gap-4" aria-labelledby="contact-channels">
        <h2 id="contact-channels" className="sr-only">
          Contact channels
        </h2>
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <h3 className="text-lg font-bold text-slate-800">General Inquiries &amp; Support</h3>
          <p className="text-sm text-slate-600">
            For questions, feedback or technical support, email us at:
            <br />
            <a href="mailto:info@azeemlab.com" className="text-[#c83a2a] hover:underline font-semibold">
              info@azeemlab.com
            </a>
          </p>
        </div>
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <h3 className="text-lg font-bold text-slate-800">Business &amp; Press</h3>
          <p className="text-sm text-slate-600">
            For partnerships, agency plans or press inquiries, contact our business team at:
            <br />
            <a href="mailto:info@azeemlab.com" className="text-[#c83a2a] hover:underline font-semibold">
              info@azeemlab.com
            </a>
          </p>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="how-we-can-help">
        <h2 id="how-we-can-help" className="text-2xl font-bold text-slate-900">
          How Can We Help?
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {topics.map((t) => (
            <article key={t.title} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-2">
              <h3 className="text-base font-bold text-slate-800">{t.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3 text-slate-600 leading-relaxed" aria-labelledby="response-times">
        <h2 id="response-times" className="text-2xl font-bold text-slate-900">
          Response Times
        </h2>
        <p>
          We typically reply within 1 to 2 business days. To help us resolve your issue faster, please include your
          account email, a short description of the problem, and a screenshot if possible. For urgent billing issues,
          mention &quot;Billing&quot; in your subject line.
        </p>
      </section>

      <p className="text-center text-sm text-slate-500 pt-2">
        Before reaching out, you might find a quick answer in our{' '}
        <Link href="/faq" className="text-[#c83a2a] hover:underline font-semibold">
          FAQ
        </Link>
        , or learn more{' '}
        <Link href="/about-us" className="text-[#c83a2a] hover:underline font-semibold">
          about us
        </Link>
        .
      </p>
    </div>
  );
}