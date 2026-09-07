export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  google_id: string;
  created_at: string;
  updated_at: string;
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
