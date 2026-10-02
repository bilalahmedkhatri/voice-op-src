'use client';

import React from 'react';

export default function AboutUsContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center">
        About Us
      </h1>
      <div className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed">
        <p>
          Welcome to <strong className="text-slate-900">GenZee Video</strong> (genzee.video). Our mission is to empower
          creators, agencies, and modern marketers with an all-in-one content automation studio. We bridge the gap between
          raw creative ideas and published multimedia by combining multi-model voice synthesis with direct Facebook,
          Instagram, and YouTube video automation.
        </p>
        <p>
          Whether you are a solo YouTuber scripting long-form documentaries, an Instagram/TikTok creator looking for daily
          viral hooks, or a digital marketing brand automating Facebook Reels, GenZee provides the studio infrastructure
          you need: ultra-natural AI voices (ElevenLabs, Fish Audio, Google Gemini), structured JSON campaign importing, and scheduled
          multi-channel publishing.
        </p>
      </div>
    </div>
  );
}
