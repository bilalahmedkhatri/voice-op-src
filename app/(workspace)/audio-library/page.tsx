import React from 'react';
import AudioLibraryClient from './components/AudioLibraryClient';

export const metadata = {
  title: 'GenZee Audio Library - Manage & Download Voiceovers',
  description: 'Manage, play, and download your generated audio tracks in GenZee Studio.',
};

export default function AudioLibraryPage() {
  return <AudioLibraryClient />;
}
