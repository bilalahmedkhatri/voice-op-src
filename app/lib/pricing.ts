export const PRICING_CONFIG = {
  // Base characters per calculation step
  charsPerStep: 500,

  // Costs per 1000 characters
  models: {
    elevenlabs: 4,
    gemini: 2,
    fishaudio: 2,
  },
  
  defaultModelCost: 2,

  // Meta Scheduling cost
  metaScheduling: 1,

  // Full workflow cost
  fullWorkflow: 5,
};

/**
 * Dynamically calculates the estimated cost for voice generation.
 * Logic: We step every 500 characters. 
 * Gemini: 2 credits / 1000 chars -> 1 credit per 500 chars step.
 * ElevenLabs: 4 credits / 1000 chars -> 2 credits per 500 chars step.
 */
export const calculateVoiceCost = (charCount: number, modelId: string, provider?: string): number => {
  if (charCount === 0) return 0;
  
  const isElevenLabs = 
    modelId.toLowerCase().includes('eleven') || 
    provider?.toLowerCase().includes('eleven');
    
  const costPer1000 = isElevenLabs ? PRICING_CONFIG.models.elevenlabs : PRICING_CONFIG.defaultModelCost;
  
  const steps = Math.ceil(charCount / PRICING_CONFIG.charsPerStep);
  const costPerStep = costPer1000 / 2;
  
  return steps * costPerStep;
};
