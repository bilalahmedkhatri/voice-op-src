import React from 'react';

export default function TermsOfServiceContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center">
        Terms of Service
      </h1>
      <div className="space-y-6 text-base text-slate-600 leading-relaxed">
        <p>
          Welcome to GenZee Video (genzee.video). By using our website and services, you agree
          to these terms. Please read them carefully.
        </p>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            1. Use of Service
          </h2>
          <p>
            Our text-to-speech (TTS) service is provided for both personal and, in some
            cases, commercial use. The free tier of our service is intended for
            non-commercial projects, testing, or evaluation. For commercial usage rights, you may
            need to upgrade to a premium plan.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            2. Generated Content
          </h2>
          <p>
            You are responsible for the text you convert into audio. You may not
            generate content that is unlawful, offensive, defamatory, or infringes on the rights
            of others. We reserve the right to terminate access for users who violate
            these terms.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            3. Intellectual Property
          </h2>
          <p>
            While you own the text you provide, the underlying synthesized voice models
            are the property of our service and its technology partners. Your license to use the
            generated audio is determined by your active plan.
          </p>
        </div>
      </div>
    </div>
  );
}