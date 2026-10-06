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

4. **Strict Component-Based Architecture (MANDATORY)**:
   - **Never dump all code, sections, or UI chunks into a single monolithic page file.**
   - All code MUST be written component-wise: decompose pages into small, focused, modular, and reusable sub-components in dedicated directories (e.g., `app/(workspace)/<feature>/components/` or `components/<feature>/`).
   - Keep page files (`page.tsx`) lean and clean as high-level orchestrators that pass typed props to modular child components.
   - Maintain a clear architectural separation of concerns (presentation, data hooks, state).

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

---

## 5. Marketing, Landing Page & UI Presentation Rules (STRICT AGENT RULES)

1. **Zero Technical API Mentions on Public Landing Pages**:
   - **MANDATORY**: *No API endpoints, API versions (e.g. `Meta Graph v21.0`), or technical backend protocol details should ever be shown on the public landing page or marketing UI.*
   - Always replace technical backend jargon with customer-centric, benefits-driven copy:
     - Use `"1-Click Social Publishing"` instead of `"Meta Graph v21.0 API integration"`.
     - Use `"Multi-Platform Publishing"` instead of `"Meta Graph API Integration"`.
     - Use `"Direct Social Publishing & Scheduling"` instead of `"Direct Meta Graph API publishing"`.
   - Never expose internal API routes, webhook structures, or database table names in marketing cards, badges, or hero sections.

2. **Model Naming & Tier Integrity**:
   - Never show small or budget-tier model names like "Kokoro 82M" in user-facing marketing copy, badges, or headlines.
   - Always highlight premium, studio-grade models: **ElevenLabs**, **Fish Audio**, and **Google Gemini Voice**.

3. **Authentic Social Feeds & Realistic Media Previews**:
   - Social feed and Reel simulators (Facebook Feed, Facebook Reel, Instagram Reel) must look authentic to real user interfaces:
     - Clean YouTube video & shorts embedding without synthetic AI status overlays.
     - Clean creator audio tags (e.g., `Original Audio • Creator Sounds`) instead of artificial synthetic labels.
     - Follow buttons styled as clean, subtle pill chips (`rounded-full bg-white/20`).
     - Balanced 50/50 responsive layout (`lg:col-span-6` / `lg:col-span-6`) to prevent excessive dead whitespace.
     - Hashtag suggestions rendered as clean rounded pill chips without `+` prefixes.

4. **Card Hierarchy & Brand Palette**:
   - Adhere to single-level card containers without nested borders.
   - Maintain the warm Coral palette (`#ff7d6e` / `#c83a2a` / `#ff9b8f`) across all components.

---

## 6. Monetization & Credit Wallet Architecture (STRICT AGENT RULES)

GenZee uses a strict **Pay-As-You-Go Credit System** (1 Credit = $0.015 USD). There are no monthly recurring subscriptions.

1. **Credit Ledger & Atomic Deductions**:
   - All credit modifications MUST go through the `credit_history` ledger table for complete auditability.
   - Credit deductions (`deductCredits`) MUST use atomic SQL queries to prevent race conditions: `UPDATE users SET available_credits = available_credits - $1 WHERE id = $2 AND available_credits >= $1`.
   - Never update credits blindly from the frontend or bypass the ledger.

2. **Deduction Costs (Reference & Future Roadmap)**:
   - **AI Caption & Hashtags (Facebook/IG)**: 1 Credit
   - **Social Scheduling (Facebook/IG)**: 1 Credit
   - **Standard Voice Synthesis (Gemini/Fish/Kokoro)**: Dynamic cost calculated via `calculateVoiceCost` (Base: 2 Credits)
   - **Premium Voice Synthesis (ElevenLabs)**: Dynamic cost calculated via `calculateVoiceCost` (Base: 4 Credits)
   - **YouTube JSON Strategy Generation (Upcoming)**: 1 Credit (Deducted when AI automatically generates a complete YouTube strategy/JSON from a topic prompt via `/api/youtube/generate-strategy`)
   - **YouTube Video Publishing & Scheduling (Upcoming)**: 1 Credit (Deducted when a Reel/Short is published or scheduled to YouTube via `/api/youtube/publish`)
   - **AI Thumbnail & Image Generation (Upcoming)**: 1 to 2 Credits (Deducted for Midjourney/Stable Diffusion API calls)
   - **Full 1-Click Automation (Caption + Audio + Schedule)**: 5 Credits (Bulk deduction)

3. **Frontend Interceptors & Top-Up Flow**:
   - Any API returning an `INSUFFICIENT_CREDITS` error must be caught by the frontend components.
   - The frontend must then dispatch the `open-topup-modal` event to trigger the `TopUpModal` component, blocking the user action until they refill.
   - The private wallet dashboard is located at `/billing` (shows transaction ledger and balance).
   - The public pricing packages are located at `/pricing` (uses Landing Page layouts).

4. **Payment Gateway (PayFast / Swich)**:
   - The top-up flow connects to the regional PayFast/Swich gateway (JazzCash, Easypaisa, Cards).
   - **Webhook Idempotency (CRITICAL)**: The `/api/billing/webhook` IPN listener must always verify that a specific transaction `reference_id` hasn't already been processed in the `credit_history` table to prevent double-crediting if the gateway sends duplicate POST requests.
