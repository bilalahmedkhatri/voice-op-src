import React from 'react';
import { FaGoogle, FaBolt, FaWaveSquare, FaMicrochip } from 'react-icons/fa';
import { SiElevenlabs } from 'react-icons/si';

export const getModelIcon = (provider: string) => {
  if (provider === 'gemini') return <FaGoogle className="text-rose-500" />;
  if (provider === 'elevenlabs') return <SiElevenlabs className="text-slate-900" />;
  if (provider === 'fish-audio') return <FaWaveSquare className="text-cyan-500" />;
  if (provider === 'kokoro') return <FaBolt className="text-amber-500" />;
  return <FaMicrochip className="text-[#ff9b8f]" />;
};

export const getFormattedModelName = (name: string, provider: string) => {
  if (provider === 'elevenlabs' || name.toLowerCase().includes('elevenlabs')) {
    return 'ElevenLabs Neural Engine';
  }
  if (name.toLowerCase().includes('lite')) {
    return 'Gemini TTS Lite';
  }
  if (provider === 'gemini' || name.toLowerCase().includes('gemini')) {
    return 'Gemini TTS';
  }
  if (provider === 'fish-audio' || name.toLowerCase().includes('fish')) {
    return 'Fish Audio V2.0 Pro';
  }
  if (provider === 'kokoro' || name.toLowerCase().includes('kokoro')) {
    return 'Open Source TTS Engine';
  }
  return name;
};

export const getModelDescription = (provider: string) => {
  if (provider === 'elevenlabs') return 'Powered by ElevenLabs';
  if (provider === 'gemini') return 'Powered by Google Gemini';
  if (provider === 'fish-audio') return 'Powered by Fish Audio';
  if (provider === 'kokoro') return 'Free & Open Source TTS Engine';
  return `Powered by ${provider.toUpperCase()}`;
};

