# AI Voiceover Generator: Developer & Agent Instructions

## Gateway app access and user ownership

- Frontend users and FastAPI gateway owners are independent identities and databases. Never send a frontend user ID as the gateway owner.
- Call the gateway from server routes with `app/lib/gatewayHeaders.ts`. Required server-only values are `GATEWAY_API_KEY`, `GATEWAY_APP_ORIGIN` and `VOICEOVER_API_URL`. Do not use `NEXT_PUBLIC_` for secrets or forward an untrusted incoming origin as the configured app origin.
- Local origin: `http://localhost:3000`; production origin: `https://www.genzee.video`. Each has a separate app/key. Backend bases are respectively `http://localhost:8000` and `https://ai-api.fastapicloud.dev`.
- Keep existing frontend session/ownership checks on stored user resources and Facebook publishing. An authorized app key does not authenticate an individual frontend user.
- Facebook tokens at the gateway belong to the registered app and its gateway owner. Legacy tokens must be reconnected; handle expired token responses by asking the user to reconnect.
- `.env.local` and `.env.production.local` are git-ignored credential files. Production hosting must receive the production values separately; the development server loads `.env.local`.
- Review [USER_OWNERSHIP.md](USER_OWNERSHIP.md) and the backend `APP_ACCESS.md` before changing authorization. Search all call sites before removing user-related code.

## TTS progress and retry rules

- Reuse `useVoiceGenerator` polling/completion logic and `GenerationStatus` for studio progress/retry; do not add a second generation flow. Place LiveAudioPreview inside the existing status section in both Studio and landing preview. Show processing before the first chunk and finalizing after all parts are ready. Only clear chunk/live/processing-toast state after the owned final audio is fetched; preserve failed/pending chunks for retry. Avoid a duplicate processing toast.
- Retry only the persisted job through `/api/templates/audio-job/retry`. Validate online history ownership or offline cookie-bound signed proof before gateway access; never accept replacement text, model or frontend owner as retry authority.
- Retry must not call `/api/voiceover` or repeat its credit/quota deductions. Keep the original operation's script/settings and account scope for completion and local history.
- A running/completed retry conflict resumes status polling. Hide resume actions while requests are active; preserve pending jobs after the polling window for a manual check.
- `LiveAudioPreview` consumes the owned `/api/templates/audio-job/stream` NDJSON proxy. Never forward app secrets to the browser. Enforce contiguous indexes, preserve the next received index on retry, and release Blob URLs on playback/unmount. Keep existing status polling for final completion/history; preview failure must not restart generation or deduct credits.
- Persist pending context through `app/lib/pendingAudioJobs.ts` in owner-namespaced local storage. Restore/check once after session identity resolves; never auto-retry failed/quota jobs. Original settings stay attached to the job, and owned status/retry remains the authority. Clear completed/inaccessible records without affecting another owner's data.
- Audio Library reuses those records plus owner-filtered server-created pending history (`/api/history?pending=true`) and links to `/admin?resumeJob=...`. Shared `AudioPlayer` uses `AudioJobRecovery` for missing-audio progress/retry in content details; never call generation or charge credits there.
- Live preview reconnects unexpected closed connections from the next received index (three consecutive failures, 1/2/4-second waits). Failed/completed events and ownership denials stop reconnecting. Retain final polling/download fallback; do not grant access using client storage.
- Prefer the smallest tested update using existing components/helpers; re-check references before deleting unused code.
- Audio Library must include current-user `generation_history` and template audio, deduplicate by job ID and retain owner filters on both sources and single-URL lookup. Offline mode reads only owner-namespaced IndexedDB. Pending cards reconcile owned status on load/focus/every 15 seconds; completion removes the card and refreshes the table without generation/credit writes. Save offline async results under the job ID to make recovery idempotent.
- Duration/size columns remain visible, with '-' for unknown values. Return numeric metadata from both Library SQL sources; PostgreSQL numerics may arrive as strings. Persist duration in the existing history column and file size in parameters.size_bytes; completion sync also updates linked template entries. Backend status must expose both statistics. Measure synchronous PCM WAVs server-side; historical inline/offline WAV headers may supply missing statistics without loading full audio into the Library response. Never expose inline header fields or internal size_bytes as voice-parameter badges. Unsupported/oversized WAV headers can have unknown duration; do not invent values.
- Ordinary focus checks must preserve the visible workspace; explicit identity-change notifications hide old content behind the existing loading screen, and changed identities still reload. Never hide the whole workspace during a same-account background verification. Internal `server_owned_job` metadata is not a user-facing voice parameter.
- Library deletion reuses `deleteOwnedAudio` for owner-filtered history removal/template unlinking. Confirm before removal, disable repeated confirmation while deleting and keep failed rows/dialogs with a readable error. Refresh/backfill the list and clamp its page after success; stop removed playback and clear matching pending/local records. Offline deletion resolves only after the owner-scoped IndexedDB transaction commits. Library removal does not physically delete gateway/B2 files.
- Library checkboxes select individual rows or the current page; header indeterminate state reflects only visible rows. Preserve selection across pages, clear it on filter/search changes, and snapshot selected IDs before batch confirmation. Reuse the existing `ids` delete route and one IndexedDB transaction for offline batches; keep single-row delete behavior intact.
- Guard every `jsonb_array_elements(audio_urls)` with `jsonb_typeof`/CASE; SQL WHERE conditions alone cannot guarantee evaluation order. Delete only canonical array links and preserve unsupported non-array data. Linking may normalize empty `{}`/null to an array but must not overwrite populated unsupported objects. Verified owned gateway 404s mark `gateway_job_missing` in history; exclude them from automatic pending restoration, retain history, and clear that marker if a later explicit status check succeeds. Never mark 5xx/timeouts missing. `npm run test:audio-json` verifies actual SQL in ON COMMIT DROP temporary tables with search_path restricted to pg_temp; no permanent records may be changed by regression tests.

## 1. Project Overview

- Workspace shell: `app/(workspace)/layout.tsx` owns mobile open/close state and page content. `app/components/workspace/WorkspaceHeader.tsx` renders the desktop/mobile header and wallet via props; `WorkspaceSidebar.tsx` owns navigation/active-link logic, overlay and the existing `SidebarAuth`. Keep shared state in the shell and preserve current icons/styles instead of duplicating shell markup in pages.
- All pages under `(workspace)` inherit this shell automatically; do not import Header/Sidebar into individual pages. Header and current-user balance stay visible on desktop and mobile; only the sidebar toggle is mobile-only. Public marketing pages retain `LandingNavbar` unless the user explicitly requests a site-wide shell change. Legacy `/facebook-integration` forwards to the covered `/facebook/integration` route.
- Reuse `WorkspacePageHeader` for Studio titles, descriptions, icons and actions. It also registers its string title through `WorkspaceTitleContext` for the shared top Header. The shell matches registered titles to the current pathname; loading/error routes use route-title fallbacks. Keep long header titles truncated on mobile so wallet controls remain visible. Balance/Top Up belong in the shared shell, not individual page headers. `SidebarAuth` supplies its existing session wallet through props, refreshes on navigation/focus/credits-updated and fences older responses. Preserve zero credits; show a dash while unavailable, never hardcode a demo balance. Existing TopUpModal remains the global payment entry point.
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

TTS frontend verification (2026-10-13): 42 isolated ownership tests, TypeScript, targeted lint, production build and diff checks passed. Mocked browser verification of the production preview passed at desktop and 390px mobile widths: one initial generation, one retry, two status checks and zero page errors. Provider/B2 synthesis and hosted deployment were not exercised. Sandbox child-process restrictions required approved local build/browser execution outside it.
