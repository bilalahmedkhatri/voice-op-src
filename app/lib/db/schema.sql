-- Neon Serverless PostgreSQL Database Schema for AI Voiceover Generator
-- 4 Lightweight Tables with strict foreign keys & JSONB metadata

-- 1. Users Table (Google OAuth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    google_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Sessions Table (Google OAuth Session Management)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Generation History Table (Chronological voiceovers with JSONB parameters)
CREATE TABLE IF NOT EXISTS generation_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    model_id VARCHAR(60) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    voice_id VARCHAR(100) NOT NULL,
    voice_name VARCHAR(100) NOT NULL,
    audio_url TEXT,
    duration_sec NUMERIC(6, 2),
    generation_time_sec NUMERIC(5, 2),
    parameters JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Compound index for fast chronological per-user history lookups
CREATE INDEX IF NOT EXISTS idx_history_user_date ON generation_history(user_id, created_at DESC);

-- 4. User Quotas Table (Daily generations & character limits)
CREATE TABLE IF NOT EXISTS user_quotas (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    generations_used INTEGER DEFAULT 0 NOT NULL,
    max_daily_generations INTEGER DEFAULT 5 NOT NULL,
    max_chars_per_request INTEGER DEFAULT 2500 NOT NULL,
    chars_used_today INTEGER DEFAULT 0 NOT NULL,
    max_daily_chars INTEGER DEFAULT 12500 NOT NULL,
    reset_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
