import React from 'react';

const faqs = [
  {
    q: 'What is the Free AI Voice Generator?',
    a: 'Our Free AI Voice Generator is a cutting-edge text-to-speech (TTS) tool that uses artificial intelligence to convert your text into realistic, natural-sounding audio. You can use it for a variety of projects, from videos and presentations to social media reels and personal projects.',
  },
  {
    q: 'Is the voice generator completely free?',
    a: 'Yes, our basic text-to-speech service is free to use. We offer a selection of high-quality AI voices and a generous character limit for your daily workflow.',
  },
  {
    q: 'Can I use the generated audio for commercial purposes?',
    a: 'Audio generated with our free plan can typically be used for personal projects. For commercial use rights, please refer to our Terms of Service or check the details of our licensing options.',
  },
  {
    q: 'What audio formats can I download?',
    a: 'You can download the generated audio directly in WAV format, which ensures crystal-clear, uncompressed studio-grade audio fidelity for editing in Premiere Pro, CapCut, DaVinci Resolve, or YouTube.',
  },
  {
    q: 'How does the AI voice synthesis work?',
    a: 'Our tool uses advanced deep learning models (including Kokoro TTS and Google Gemini) to analyze your text and generate human-like speech with proper inflection, pacing, and tone.',
  },
];

export default function FaqContent() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-500">
          Everything you need to know about our free AI voiceover synthesis.
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