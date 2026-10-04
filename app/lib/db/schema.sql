-- Neon Serverless PostgreSQL Database Schema for AI Voiceover Generator
-- 4 Lightweight Tables with strict foreign keys & JSONB metadata

-- 1. Users Table (Google OAuth with Wallet Balance & Tier)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    google_id TEXT UNIQUE NOT NULL,
    available_credits INTEGER DEFAULT 50 NOT NULL,
    tier VARCHAR(20) DEFAULT 'free' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS available_credits INTEGER DEFAULT 50 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free' NOT NULL;
UPDATE users SET available_credits = 50 WHERE available_credits IS NULL;
UPDATE users SET tier = 'free' WHERE tier IS NULL;

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

-- 5. Voice Presets Table (Saved voice & model parameter profiles)
CREATE TABLE IF NOT EXISTS voice_presets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preset_name VARCHAR(100) NOT NULL,
    model_id VARCHAR(60) NOT NULL,
    voice_id VARCHAR(100) NOT NULL,
    voice_name VARCHAR(100) NOT NULL,
    language VARCHAR(20),
    gender VARCHAR(20),
    parameters JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_presets_user_date ON voice_presets(user_id, created_at DESC);

-- 6. JSON Templates Table
CREATE TABLE IF NOT EXISTS json_templates (
    id TEXT PRIMARY KEY,
    json_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    audio_urls JSONB DEFAULT '[]'::jsonb,
    confirmed_by_email TEXT,
    view_count INTEGER DEFAULT 0 NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE json_templates ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
UPDATE json_templates SET user_id = updated_by WHERE user_id IS NULL AND updated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_templates_user_date ON json_templates(user_id, created_at DESC);

-- 7. Connected Facebook Pages & Instagram Business Accounts
CREATE TABLE IF NOT EXISTS facebook_pages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    page_name TEXT NOT NULL,
    page_category TEXT,
    picture_url TEXT,
    instagram_business_account_id TEXT,
    instagram_username TEXT,
    instagram_profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_page UNIQUE (user_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_fb_pages_user ON facebook_pages(user_id);

-- 8. Unified Scheduled & Published Posts Table (FB + IG)
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    page_name TEXT,
    destination VARCHAR(30) DEFAULT 'facebook' NOT NULL,
    post_type VARCHAR(30) DEFAULT 'reel' NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    media_url TEXT,
    scheduled_publish_time TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'published' NOT NULL,
    fb_post_id TEXT,
    ig_media_id TEXT,
    template_id TEXT REFERENCES json_templates(id) ON DELETE SET NULL,
    content_item_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user ON scheduled_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status, scheduled_publish_time);

-- 9. Credit History Ledger Table (Pay-As-You-Go Wallet Deductions & Top-Ups)
CREATE TABLE IF NOT EXISTS credit_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_history_user ON credit_history(user_id, created_at DESC);


