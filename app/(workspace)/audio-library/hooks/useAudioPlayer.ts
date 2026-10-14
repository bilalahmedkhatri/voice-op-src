'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackVersion = useRef(0);

  const stop = useCallback(() => {
    ++playbackVersion.current;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
    setLoadingId(null);
  }, []);

  const playAudio = useCallback(async (id: string, getUrl: () => Promise<string>) => {
    if (playingId === id) {
      stop();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setLoadingId(id);
    setPlayingId(null);
    const version = ++playbackVersion.current;

    try {
      const url = await getUrl();
      if (version !== playbackVersion.current) return;
      if (!url) {
        setLoadingId(null);
        return;
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingId(null);
        setLoadingId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingId(null);
        setLoadingId(null);
        audioRef.current = null;
      };

      await audio.play();
      if (version !== playbackVersion.current) { audio.pause(); return; }
      setPlayingId(id);
    } catch (err) {
      console.error('Audio playback failed:', err);
      if (version === playbackVersion.current) { setPlayingId(null); audioRef.current = null; }
    } finally {
      if (version === playbackVersion.current) setLoadingId(null);
    }
  }, [playingId, stop]);

  const togglePlay = useCallback((id: string, url: string) => {
    ++playbackVersion.current;
    if (playingId === id) {
      stop();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(id);

    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.play().catch((err) => {
      console.error('Audio playback failed:', err);
      setPlayingId(null);
      audioRef.current = null;
    });
  }, [playingId, stop]);

  useEffect(() => {
    const invalidatePlayback = () => { ++playbackVersion.current; };
    return () => {
      invalidatePlayback();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { playingId, loadingId, playAudio, togglePlay, stop };
}
