import React from 'react';
import Link from 'next/link';

export default function ContactUs() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center">
        Contact Us
      </h1>
      <div className="space-y-6 text-base text-slate-600 leading-relaxed">
        <p className="text-center text-slate-500 max-w-lg mx-auto">
          We&apos;d love to hear from you! Whether you have a question about our features, a suggestion for improvement, or a business inquiry, please don&apos;t hesitate to reach out.
        </p>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <h2 className="text-lg font-bold text-slate-800">
            General Inquiries
          </h2>
          <p className="text-sm">
            For general questions, feedback, or support, please email us at:
            <br />
            <a
              href="mailto:info@azeemlab.com"
              className="text-[#c83a2a] hover:underline font-semibold"
            >
              info@azeemlab.com
            </a>
          </p>
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <h2 className="text-lg font-bold text-slate-800">
            Business &amp; Press
          </h2>
          <p className="text-sm">
            For partnership opportunities or press inquiries, please contact our business team at:
            <br />
            <a
              href="mailto:info@azeemlab.com"
              className="text-[#c83a2a] hover:underline font-semibold"
            >
              info@azeemlab.com
            </a>
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 pt-2">
          Before reaching out, you might find a quick answer to your question in our{' '}
          <Link href="/faq" className="text-[#c83a2a] hover:underline font-semibold">
            FAQ section
          </Link>
          .
        </p>
      </div>
    </div>
  );
}