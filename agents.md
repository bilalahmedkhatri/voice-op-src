# AI Voiceover Generator: Developer & Agent Instructions

## 1. Project Overview
This project is an **AI Voiceover Generator** built with Next.js (App Router), React, and Tailwind CSS. It supports multiple open-source AI voice synthesis models through a unified, schema-driven architecture with dual-mode storage (Online Neon Postgres + 100% Offline Local IndexedDB).

---

## 2. Multi-Model Architecture

The application uses a **Unified Provider & Schema-Driven Architecture** (`app/lib/tts/`):

```
free_voice_generator/app/
├── lib/
│   ├── config.ts                      # Centralized environment flags (isDatabaseEnabled, etc.)
│   ├── localHistoryStorage.ts         # Offline IndexedDB audio storage engine
│   ├── auth/googleAuth.ts             # Google OAuth & session management
│   ├── db/                            # Neon Serverless PostgreSQL client & schema
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
│   ├── GenerationHistory.tsx          # Dual-mode history list & audio player
│   ├── TextInput.tsx                  # Unconstrained text editor with character counter
│   ├── AudioPlayer.tsx                # Audio playback bar with generation speed badge
│   └── VoiceControls.tsx              # Assembled voice selection & model controls
```

---

## 3. Best Practices for Modifying Code, Classes & Functions (MANDATORY AGENT RULES)

Whenever the user requests changing any parameter, limit, feature, or function:

1. **Perform Exhaustive Project Search First**:
   - Always run `grep_search` across the entire codebase (`app/api/`, `app/components/`, `app/hooks/`, `app/lib/`) to identify **ALL** places where that variable, constant, or condition exists.
   - Never update a constant or UI component without also updating the corresponding API route and validation handler.

2. **No Hardcoded Constraints**:
   - Do **NOT** hardcode arbitrary length limits (e.g. 5,000 characters) into API routes or frontend inputs.
   - Long texts (multi-thousand characters/words) must be passed directly to the AI TTS synthesis engines without artificial frontend or API blocks.
   - All rate-limiting or quota tracking must be dynamic and driven strictly by the database (`user_quotas` table).

3. **Dual-Mode Compatibility**:
   - Always verify that new features work in **both Online Mode** (Neon DB + Google OAuth) and **Offline Local Mode** (IndexedDB + Guest Session).

---

## 4. How to Add a New AI Voice Model (Agent Guide)

Follow these **3 steps**:

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
    // Add custom sliders, toggles, or dropdowns here
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
  'new-model-id': new NewModelProvider(),
};
```
