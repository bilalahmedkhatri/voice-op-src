import Replicate from 'replicate';
import kokoroVoicesData from '../data/kokoroVoices.json';

export interface ReplicateVoiceParams {
  text: string;
  voice: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface ReplicateVoiceResult {
  audioUrl: string;
  audioBuffer: ArrayBuffer;
}

export interface KokoroVoice {
  voice_id: string;
  voice_name: string;
  gender: string;
  accent: string;
  language: string;
  quality: string;
  training: string;
  featured?: boolean;
  description: string;
}

const KOKORO_MODEL = "jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13";

export async function generateWithReplicate(params: ReplicateVoiceParams): Promise<ReplicateVoiceResult> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set');
  }

  const replicate = new Replicate({ auth: apiKey });

  const input: { text: string; voice: string; speed?: number } = {
    text: params.text,
    voice: params.voice,
  };
  
  if (params.speed !== undefined && params.speed !== 1) {
    input.speed = params.speed;
  }

  const output = await replicate.run(KOKORO_MODEL, { input }) as { url: () => string };
  const audioUrl = output.url();
  
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio from Replicate: ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();

  return {
    audioUrl,
    audioBuffer,
  };
}

/**
 * Returns the 32 curated voices supported by Replicate cloud
 */
export function getAvailableReplicateVoices() {
  const replicateSampleIds = [
    'af_alloy', 'af_aoede', 'af_bella', 'af_jessica', 'af_kore', 'af_nicole', 
    'af_nova', 'af_river', 'af_sarah', 'af_sky', 'am_adam', 'am_echo', 
    'am_eric', 'am_fenrir', 'am_liam', 'am_michael', 'am_onyx', 'am_puck',
    'bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily', 'bm_daniel', 'bm_fable',
    'bm_george', 'bm_lewis', 'ff_siwis', 'hf_alpha', 'hm_omega', 'hm_psi',
    'if_sara', 'im_nicola'
  ];
  
  const allVoices: KokoroVoice[] = [
    ...kokoroVoicesData.americanEnglish,
    ...kokoroVoicesData.britishEnglish,
    ...kokoroVoicesData.french,
    ...kokoroVoicesData.hindi,
    ...kokoroVoicesData.italian,
  ];

  return allVoices
    .filter(voice => replicateSampleIds.includes(voice.voice_id))
    .map(voice => ({
      voice_id: voice.voice_id,
      voice_name: `${voice.voice_name} (${voice.accent} ${voice.gender})`,
      gender: voice.gender.toLowerCase(),
      accent: voice.accent,
      language: voice.language,
      sample_url: `/api/voiceover/sample/${voice.voice_id}`,
      description: voice.description,
      quality: voice.quality,
      featured: voice.featured || false,
    }));
}

/**
 * Returns all 54 voices supported by Kokoro Local Gateway (localhost:8000)
 */
export function getAllLocalVoices() {
  const allVoices: KokoroVoice[] = [
    ...kokoroVoicesData.americanEnglish,
    ...kokoroVoicesData.britishEnglish,
    ...kokoroVoicesData.spanish,
    ...kokoroVoicesData.french,
    ...kokoroVoicesData.hindi,
    ...kokoroVoicesData.italian,
    ...kokoroVoicesData.japanese,
    ...kokoroVoicesData.portuguese,
    ...kokoroVoicesData.mandarinChinese,
  ];

  return allVoices.map(voice => ({
    voice_id: voice.voice_id,
    voice_name: `${voice.voice_name} (${voice.accent} ${voice.gender})`,
    gender: voice.gender.toLowerCase(),
    accent: voice.accent,
    language: voice.language,
    sample_url: `/api/voiceover/sample/${voice.voice_id}`,
    description: voice.description,
    quality: voice.quality,
    featured: voice.featured || false,
  }));
}
