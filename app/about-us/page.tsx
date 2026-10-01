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
          Welcome to the home of the most advanced Free AI Voice Generator. Our
          mission is to make high-quality voice synthesis accessible to everyone.
          Whether you&apos;re a content creator, a student, a developer, or just someone
          looking to bring text to life, our tool is designed for you.
        </p>
        <p>
          We believe in the power of voice. That&apos;s why we&apos;ve invested in
          state-of-the-art artificial intelligence to create a text-to-speech (TTS)
          engine that produces incredibly realistic and natural-sounding voices. Our
          platform is intuitive, easy to use, and, best of all, free for your basic
          needs.
        </p>
      </div>
    </div>
  );
}
