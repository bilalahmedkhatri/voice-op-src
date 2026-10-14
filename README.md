# GenZee Video — AI Voice & Content Automation Studio

> Official Domain: [https://genzee.video](https://genzee.video)

GenZee Video is a full-featured AI content creation and automation studio built with Next.js (App Router), React, and Tailwind CSS. It enables creators, agencies, and marketers to transform raw scripts into human-grade voiceovers, orchestrate multi-week campaigns from JSON prompts, and publish or schedule Reels across Facebook and Instagram.

---

## 🌟 Key Features

### 1. Multi-Model Voice Studio (`/admin`)
* **State-of-the-Art Neural Engines**: Powered by **ElevenLabs**, **Fish Audio**, and **Google Gemini** for hyper-realistic and expressive conversational speech.
* **Format-Specific Synthesis**: Instant optimization for **9:16 vertical Reels/Shorts** and **16:9 widescreen YouTube** videos.
* **Granular Controls**: Dial in speed (0.5x–2.0x), pitch, volume, and voice style with real-time waveform visualization.
* **Dual-Mode Persistence**: Neon Serverless PostgreSQL preset sync + 100% offline IndexedDB local storage.
* **Live Audio Preview**: Studio and landing demo play ready audio parts in order with **Listen live**. Retry resumes the same job without repeating generation charges; the final merged audio remains available. Preview access follows existing account/guest ownership checks.
* **Resume Unfinished Voiceovers**: Refresh restores pending studio jobs. Audio Library links unfinished work back to the studio, and content-detail players offer progress/retry for missing audio. Stream interruptions reconnect from the next received part; account ownership checks remain required.
* **Owned Audio Library**: Completed Studio and template voices appear together, deduplicated by job ID. Unfinished cards reconcile completion and refresh the list automatically; offline mode uses account-scoped IndexedDB. Routine tab focus keeps the workspace visible.
* **Audio Statistics**: Duration and file-size columns stay visible. Saved WAV metadata is retained across completion/history, and unknown values display a dash.
* **Remove Audio Tracks**: Use a track's trash button and confirm removal. Failed removals keep the track available with a retry message; successful removal stops playback and refreshes the current list/page.
* **Select Multiple Tracks**: Row checkboxes and a current-page select-all checkbox support selection across pages. **Delete selected** confirms the selected count and removes the chosen tracks together; search/model-filter changes clear selection.

### 2. Prompt-to-JSON Campaign Engine (`/json-generator`)
* **Universal LLM Compatibility**: Ingest structured campaign JSON from Claude, ChatGPT, Gemini, or DeepSeek.
* **Interactive Campaign Calendars**: Visual day-by-day breakdowns with hooks, scripts, and captions.
* **1-Click Studio Bridge**: Transfer any generated script directly into the Voice Studio (`/admin`) with a single click.

### 3. Facebook & Instagram Automation (`/facebook/integration`)
* **Direct Social Publishing & Scheduling**: Connect verified Facebook Pages and linked Instagram Business accounts.
* **Real-Time Feed Previews**: Test posts inside interactive desktop feed, mobile feed, and 9:16 Reel device simulators.
* **Long-Term Scheduling**: Publish immediately or schedule posts up to 75 days in advance with retry and cancellation handlers.

### 4. YouTube Strategy Studio (`/youtube/templates`)
* **Long-Form to Shorts Pipeline**: Develop comprehensive video scripts, chapter breakdowns, and extract high-retention 3-second Shorts hooks.
* **Direct Voice Transfer**: Move from script ideation straight into synthesis with prefilled video formats.

---

## 🧭 Application Routing Architecture

| Route | Description |
|---|---|
| `/` | **Master Landing Page**: Editorial value prop, live speech synthesis playground, prompt-to-JSON engine, and real-time social feed simulator. |
| `/admin` | **Voice Studio Workspace**: The internal production workspace with model selector, text input, audio player, and preset storage. |
| `/json-generator` | **JSON Engine**: Universal parser and editor for multi-platform campaign strategies. |
| `/youtube/templates` | **YouTube Strategy**: Long-form and Shorts script generation and tracking. |
| `/facebook/templates` | **Facebook Content**: Pre-designed social campaign templates. |
| `/facebook/integration` | **Meta Publishing Studio**: Page token management, Reel composition, and scheduled post manager. |
| `/blog` | **Creator Blog**: Articles, tutorials, and growth strategies for digital creators. |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ (Node 20+ recommended)
* pnpm, npm, or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or edit `.env.local`:

Gateway app access is separate from frontend Google login. The gateway's existing
Google owner approves this app; frontend users continue using their own sessions
and database. Server routes attach app credentials using `app/lib/gatewayHeaders.ts`.
Required server-only gateway configuration:

| Environment | App origin | Gateway base | Local configuration file |
|---|---|---|---|
| Development | `http://localhost:3000` | `http://localhost:8000` | `.env.local` |
| Production | `https://www.genzee.video` | `https://ai-api.fastapicloud.dev` | `.env.production.local` |

Set `GATEWAY_APP_ORIGIN`, `VOICEOVER_API_URL` and the separate environment's
`GATEWAY_API_KEY`. The backend provisioning script has written these values to
git-ignored files; never commit or put the key into a `NEXT_PUBLIC_` variable.
For hosted production, copy the production values into the hosting provider's
server environment and redeploy. Restart local services after configuration changes.
Reconnect Facebook Pages after app provisioning so the gateway stores tokens
under the correct app. Frontend and gateway ownership checks both remain required.
See [USER_OWNERSHIP.md](USER_OWNERSHIP.md) for per-user ownership details.

```env
# Domain
NEXT_PUBLIC_APP_URL=https://genzee.video

# Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
NEXT_PUBLIC_ENABLE_DATABASE=true

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://genzee.video/api/auth/callback/google

# Meta Facebook App ID
NEXT_PUBLIC_FB_APP_ID=your-facebook-app-id

# Voiceover API & Replicate
USE_REPLICATE=true
REPLICATE_API_TOKEN=your-replicate-token
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page, or [http://localhost:3000/admin](http://localhost:3000/admin) to open the Voice Studio.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🛡️ Security & Privacy

* **OAuth CSRF Protection**: State parameters are backed by cryptographic nonces stored in short-lived HTTP-only cookies.
* **Strict API Authorization**: All Facebook and preset routes strictly enforce user session validation (`401 Unauthorized` for unauthenticated callers).
* **Zero-Telemetry Offline Mode**: Set `NEXT_PUBLIC_ENABLE_DATABASE=false` to run 100% locally with zero external database dependencies.

---

## 📄 License & Attribution

&copy; GenZee Video ([genzee.video](https://genzee.video)). All rights reserved.
Powered by ElevenLabs, Fish Audio & Google Gemini neural models.


## TTS progress and selective retry (2026-10-13)

The studio and landing demo reuse `useVoiceGenerator` and `GenerationStatus` to show completed/total audio parts and resume unfinished jobs. `Retry unfinished audio` calls the same saved job; it never creates another generation or repeats the initial credit/quota deduction. `Check progress` resumes polling after the polling window ends. Retry uses the original script/settings even if the editor changes.

`POST /api/templates/audio-job/retry` accepts only `jobId`. Online requests check the session user's existing history record before contacting the gateway. Offline requests require the guest cookie and matching signed job token. Gateway credentials remain server-only. Existing status polling and result/history synchronization are reused; no frontend schema migration is needed.

The initial checkpoint phase kept pending context only in the mounted studio. Subsequent recovery phases now restore owner-scoped jobs after navigation/reload, provide Library/content-detail recovery and ordered live preview, and archive logs at the gateway. The existing checkpoint migration and gateway restart are required; the 2026-10-14 Library/concurrency correction adds no migration.

TTS frontend verification (2026-10-13): 42 isolated ownership tests, TypeScript, targeted lint, production build and diff checks passed. Mocked browser verification of the production preview passed at desktop and 390px mobile widths: one initial generation, one retry, two status checks and zero page errors. Provider/B2 synthesis and hosted deployment were not exercised. Sandbox child-process restrictions required approved local build/browser execution outside it.


Studio headers and wallet: all routes under `app/(workspace)` inherit one desktop/mobile Header and Sidebar. Current-user balance and Top Up use the existing SidebarAuth session and modal, refreshed on navigation, focus and credit updates; unknown balance displays a dash and zero stays zero. WorkspacePageHeader keeps page-title typography, icon sizing, spacing and actions consistent. Public pages retain their marketing navbar.

Header/wallet verification (2026-10-14): production build and TypeScript passed. Mocked Edge browser checks covered all 15 Studio routes on desktop and 390px mobile, nine primary page-title headers, credit-event/focus refresh, zero/unknown/guest balance, preserved template refresh, Top Up modal, and public navbar isolation, with zero page errors. Shared components passed targeted lint (two existing image warnings); older page files still have lint errors. No live payment or hosted deployment was exercised.

The shared Studio Header displays the current page title instead of a fixed brand label. WorkspacePageHeader registers the same title, including dynamic video/post titles; route fallbacks cover loading/error views and long titles truncate without hiding credits.

TTS progress layout (2026-10-14): processing, chunk progress, live preview and retry share one compact status area. Final audio clears live/progress state and stale processing notifications. Production build/TypeScript, targeted status/live lint and 64 ownership tests passed. Mocked desktop/mobile browser checks verified ordered playback, one generation/one retry, removal of completed controls, detail/server-history recovery and zero page errors; no live provider synthesis or payment was performed.
