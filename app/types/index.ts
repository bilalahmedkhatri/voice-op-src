export interface VoiceParams {
  text: string;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  modelId?: string;
  options?: Record<string, any>;
}

export * from '../lib/tts/types';
