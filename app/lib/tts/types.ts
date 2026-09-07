export interface ParameterSchema {
  id: string;
  label: string;
  type: 'slider' | 'select' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
  defaultValue: number | string | boolean;
  description?: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  badge: string;
  description: string;
  parameters: ParameterSchema[];
  defaultParams: Record<string, any>;
  apiUrlEnvVar: string;
  defaultApiUrl: string;
}

export interface UnifiedTTSRequest {
  modelId: string;
  voiceId: string;
  text: string;
  options?: Record<string, any>;
}

export interface UnifiedTTSResponse {
  id: string;
  audioUrl: string;
  durationSeconds?: number;
  fileSize?: number;
  expiresAt?: string;
  remainingUses?: number;
  resetAt?: string | null;
  format?: string;
  metadata?: Record<string, any>;
}

export interface TTSProvider {
  generateAudio(request: UnifiedTTSRequest): Promise<UnifiedTTSResponse>;
}
