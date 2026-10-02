import React from 'react';

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center">
        Privacy Policy
      </h1>
      <div className="space-y-6 text-base text-slate-600 leading-relaxed">
        <p>
          Your privacy is important to us. This Privacy Policy explains how we
          collect, use, and protect your information when you use GenZee Video (genzee.video).
        </p>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Information We Collect
          </h2>
          <p>
            We may collect information you provide to us, such as the text you submit
            for voice generation. We do not store your text or the generated audio on
            our servers long-term for the free service. We may also collect anonymous
            usage metrics to improve our text-to-speech (TTS) service performance and reliability.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            How We Use Your Information
          </h2>
          <p>
            The primary use of the text you provide is to generate the audio output. We
            may use anonymized data to benchmark and improve our AI voice synthesis pipelines.
            We do not sell, rent, or trade your personal data to any third parties.
          </p>
        </div>
      </div>
    </div>
  );
}