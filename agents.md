# AI Voiceover Generator: Developer & Agent Instructions

## 1. Project Overview
This project is an **AI Voiceover Generator** built with Next.js (App Router), React, and Tailwind CSS. It supports multiple open-source AI voice synthesis models through a unified, schema-driven architecture.

---

## 2. Multi-Model Architecture

The application uses a **Unified Provider & Schema-Driven Architecture** (`app/lib/tts/`):

```
free_voice_generator/app/
├── lib/
│   └── tts/
│       ├── types.ts                   # Unified types (UnifiedTTSRequest, ModelDefinition, ParameterSchema)
│       ├── registry.ts                # Master catalog of models & their parameter schemas
│       ├── unifiedService.ts          # Central dispatcher: `generateSpeech(request)`
│       └── providers/                 # Model-specific API adapters
│           ├── kokoroProvider.ts      # Kokoro-82M adapter
│           └── fishAudioProvider.ts   # Fish Audio / Fish-Speech adapter
├── components/
│   ├── ModelSelector.tsx              # Model switcher tab UI
│   ├── DynamicParameterControls.tsx   # Schema-driven auto-renderer for sliders & toggles
│   └── VoiceControls.tsx              # Assembled voice selection & model controls
```

---

## 3. Supported Open-Source Models

1. **Kokoro-82M (`kokoro-82m`)**:
   - Ultra-fast open-source TTS model.
   - Parameters: `speed` (0.5x – 2.0x).
   - Backend: Local FastAPI server (`http://localhost:8000`) or Replicate.

2. **Fish Audio / Fish-Speech (`fish-audio`)**:
   - High-fidelity expressive open-source model.
   - Parameters: `speed`, `temperature` (expressiveness), `top_p` (stability), `repetition_penalty` (clarity).
   - Backend: Local Fish-Speech server (`http://localhost:8080/v1/tts`) or custom API.

---

## 4. How to Add a New AI Voice Model (Agent Guide)

When instructed to add a new AI voice model (e.g., *ChatTTS, XTTS, Piper, Bark, or custom TTS API*), follow these **3 steps**:

### Step 1: Register Model & Parameter Schema in `app/lib/tts/registry.ts`
Add a new model definition entry:
```typescript
'new-model-id': {
  id: 'new-model-id',
  name: 'New Model Name',
  badge: 'Feature Badge',
  description: 'Model description',
  apiUrlEnvVar: 'NEW_MODEL_API_URL',
  defaultApiUrl: 'http://localhost:8090',
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
    },
    // Add any custom parameters (sliders, toggles, dropdowns)
  ],
  defaultParams: {
    speed: 1.0,
  },
}
```

### Step 2: Create Provider Adapter in `app/lib/tts/providers/<model>Provider.ts`
Implement the `TTSProvider` interface:
```typescript
import { TTSProvider, UnifiedTTSRequest, UnifiedTTSResponse } from '../types';

export class NewModelProvider implements TTSProvider {
  async generateAudio(request: UnifiedTTSRequest): Promise<UnifiedTTSResponse> {
    const { text, voiceId, options = {} } = request;
    // Call the model backend / API endpoint
    // Return UnifiedTTSResponse with audioUrl, id, format, etc.
  }
}
```

### Step 3: Register in Dispatcher (`app/lib/tts/unifiedService.ts`)
Add the provider instance to the `providers` map:
```typescript
import { NewModelProvider } from './providers/newModelProvider';

const providers: Record<string, TTSProvider> = {
  'kokoro-82m': new KokoroProvider(),
  'fish-audio': new FishAudioProvider(),
  'new-model-id': new NewModelProvider(), // <-- Added here
};
```

> [!IMPORTANT]
> **No UI Modifications Required**: The frontend (`VoiceControls` & `DynamicParameterControls`) will automatically detect the new model from `registry.ts`, render its tab, and dynamically display all of its configured parameter sliders/toggles!
