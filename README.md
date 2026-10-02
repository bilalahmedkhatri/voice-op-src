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

### 2. Prompt-to-JSON Campaign Engine (`/json-generator`)
* **Universal LLM Compatibility**: Ingest structured campaign JSON from Claude, ChatGPT, Gemini, or DeepSeek.
* **Interactive Campaign Calendars**: Visual day-by-day breakdowns with hooks, scripts, and captions.
* **1-Click Studio Bridge**: Transfer any generated script directly into the Voice Studio (`/admin`) with a single click.

### 3. Facebook & Instagram Automation (`/facebook/integration`)
* **Direct Meta Graph API Integration**: Connect verified Facebook Pages and linked Instagram Business accounts.
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
