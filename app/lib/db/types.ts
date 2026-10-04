export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  google_id: string;
  available_credits: number;
  tier: 'free' | 'starter' | 'pro';
  created_at: string;
  updated_at: string;
}

export interface DbCreditHistory {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  action_type:
    | 'welcome_bonus'
    | 'caption_generation'
    | 'standard_voiceover'
    | 'premium_voiceover'
    | 'social_schedule'
    | 'full_automation'
    | 'topup_starter'
    | 'topup_pro'
    | 'admin_adjustment';
  description: string;
  reference_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DbSession {
  id: string;
  user_id: string;
  session_token: string;
  expires: string;
  created_at: string;
}

export interface DbGenerationHistory {
  id: string;
  user_id: string;
  prompt_text: string;
  model_id: string;
  model_name: string;
  voice_id: string;
  voice_name: string;
  audio_url: string | null;
  duration_sec: number | null;
  generation_time_sec: number | null;
  parameters: Record<string, any>;
  created_at: string;
}

export interface DbUserQuota {
  user_id: string;
  generations_used: number;
  max_daily_generations: number;
  max_chars_per_request: number;
  chars_used_today: number;
  max_daily_chars: number;
  reset_at: string;
  updated_at: string;
}
