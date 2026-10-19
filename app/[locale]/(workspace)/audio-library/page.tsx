import {localizedMetadata} from '@/i18n/metadata';
import {isLocale} from '@/i18n/routing';
import {notFound} from 'next/navigation';
import React from 'react';
import AudioLibraryClient from './components/AudioLibraryClient';

const pageMetadata = {
  title: 'GenZee Audio Library - Manage & Download Voiceovers',
  description: 'Manage, play, and download your generated audio tracks in GenZee Studio.',
};

export default function AudioLibraryPage() {
  return <AudioLibraryClient />;
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return localizedMetadata(pageMetadata, locale, "/audio-library");
}
