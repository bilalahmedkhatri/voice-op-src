import { ModelDefinition } from './types';

export const TTS_MODELS: Record<string, ModelDefinition> = {
  'kokoro-local': {
    id: 'kokoro-local',
    name: 'Kokoro 82M (Local Gateway)',
    badge: 'Local ONNX • 54 Voices',
    description: 'Ultra-fast local ONNX inference with all 54 international voices.',
    apiUrlEnvVar: 'VOICEOVER_API_URL',
    defaultApiUrl: 'http://localhost:8000',
    parameters: [
      {
        id: 'speed',
        label: 'Speed',
        type: 'slider',
        min: 0.25,
        max: 4.0,
        step: 0.1,
        unit: 'x',
        defaultValue: 1.0,
        description: 'Playback rate of the synthesized speech (0.25x - 4.0x)',
      },
    ],
    defaultParams: {
      speed: 1.0,
    },
  },
  'kokoro-replicate': {
    id: 'kokoro-replicate',
    name: 'Kokoro 82M (Replicate Cloud)',
    badge: 'Cloud API • 32 Voices',
    description: 'Cloud-hosted Kokoro 82M model running on Replicate infrastructure.',
    apiUrlEnvVar: 'REPLICATE_API_TOKEN',
    defaultApiUrl: 'https://api.replicate.com',
    parameters: [
      {
        id: 'speed',
        label: 'Speed',
        type: 'slider',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        unit: 'x',
        defaultValue: 1.0,
        description: 'Playback rate of the synthesized speech (0.5x - 2.0x)',
      },
    ],
    defaultParams: {
      speed: 1.0,
    },
  },
  'fish-audio': {
    id: 'fish-audio',
    name: 'Fish Audio (Fish-Speech)',
    badge: 'High-Fidelity Expressive',
    description: 'High-fidelity voice synthesis & cloning open-source model.',
    apiUrlEnvVar: 'FISH_AUDIO_API_URL',
    defaultApiUrl: 'http://localhost:8080',
    parameters: [
      {
        id: 'speed',
        label: 'Speed',
        type: 'slider',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        unit: 'x',
        defaultValue: 1.0,
        description: 'Playback speed of synthesized speech',
      },
      {
        id: 'temperature',
        label: 'Temperature (Expressiveness)',
        type: 'slider',
        min: 0.1,
        max: 1.0,
        step: 0.05,
        unit: '',
        defaultValue: 0.7,
        description: 'Controls expressiveness and vocal variability (lower = more deterministic)',
      },
      {
        id: 'top_p',
        label: 'Top-P (Stability)',
        type: 'slider',
        min: 0.1,
        max: 1.0,
        step: 0.05,
        unit: '',
        defaultValue: 0.7,
        description: 'Nucleus sampling threshold for voice consistency',
      },
      {
        id: 'repetition_penalty',
        label: 'Repetition Penalty',
        type: 'slider',
        min: 1.0,
        max: 1.5,
        step: 0.05,
        unit: '',
        defaultValue: 1.2,
        description: 'Suppresses repeating sounds and unnatural stutter artifacts',
      },
    ],
    defaultParams: {
      speed: 1.0,
      temperature: 0.7,
      top_p: 0.7,
      repetition_penalty: 1.2,
    },
  },
};

export const DEFAULT_MODEL_ID = 'kokoro-local';

export function getModelDefinition(modelId: string): ModelDefinition {
  if (modelId === 'kokoro-82m') return TTS_MODELS['kokoro-local'];
  return TTS_MODELS[modelId] || TTS_MODELS[DEFAULT_MODEL_ID];
}

export function getAllModels(): ModelDefinition[] {
  return Object.values(TTS_MODELS);
}
