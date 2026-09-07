import { TTSProvider, UnifiedTTSRequest, UnifiedTTSResponse } from './types';
import { KokoroProvider } from './providers/kokoroProvider';
import { FishAudioProvider } from './providers/fishAudioProvider';
import { getModelDefinition, DEFAULT_MODEL_ID } from './registry';

const kokoroProvider = new KokoroProvider();
const fishAudioProvider = new FishAudioProvider();

const providers: Record<string, TTSProvider> = {
  'kokoro-local': kokoroProvider,
  'kokoro-replicate': kokoroProvider,
  'kokoro-82m': kokoroProvider,
  'fish-audio': fishAudioProvider,
};

/**
 * Unified dispatch function to generate speech across any registered AI model
 */
export async function generateSpeech(request: UnifiedTTSRequest): Promise<UnifiedTTSResponse> {
  const modelId = request.modelId || DEFAULT_MODEL_ID;
  const provider = providers[modelId];

  if (!provider) {
    throw new Error(
      `Unsupported model ID "${modelId}". Available models: ${Object.keys(providers).join(', ')}`
    );
  }

  // Validate that text and voiceId are present
  if (!request.text || typeof request.text !== 'string' || !request.text.trim()) {
    throw new Error('Text is required and must not be empty');
  }
  if (!request.voiceId || typeof request.voiceId !== 'string') {
    throw new Error('Voice ID is required');
  }

  // Merge default parameters from registry if not explicitly provided
  const modelDef = getModelDefinition(modelId);
  const mergedOptions = {
    ...modelDef.defaultParams,
    ...(request.options || {}),
  };

  return provider.generateAudio({
    ...request,
    options: mergedOptions,
  });
}

/**
 * Register a new provider dynamically at runtime if needed
 */
export function registerProvider(modelId: string, provider: TTSProvider) {
  providers[modelId] = provider;
}
