/**
 * Web Audio API synthesized completion chime & notification helper.
 * Zero external asset dependencies, instant playback across active and background tabs.
 */
export function playCompletionSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic two-tone pleasant success chord (E5 = 659.25 Hz, G#5 = 830.61 Hz, B5 = 987.77 Hz)
    const notes = [
      { freq: 659.25, time: 0, duration: 0.35, gain: 0.12 },
      { freq: 987.77, time: 0.1, duration: 0.45, gain: 0.15 },
    ];

    notes.forEach(({ freq, time, duration, gain: peakGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Smooth attack and exponential decay
      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration + 0.05);
    });
  } catch (err) {
    console.warn('Completion sound notification skipped:', err);
  }
}
