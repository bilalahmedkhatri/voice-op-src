/**
 * Generates structured, descriptive filenames for downloaded voiceovers.
 * Format: <format>_<voice_name>_<language>_<parameters>_<HHmm>.<ext>
 * Example: short_af_bella_en-us_speed1.0x_1530.wav
 */

export interface FilenameOptions {
  videoFormat?: 'short' | 'long' | string;
  voiceName?: string;
  language?: string;
  parameters?: Record<string, any>;
  date?: Date | string | number;
  extension?: string;
}

export function generateVoiceoverFilename({
  videoFormat,
  voiceName = 'voice',
  language,
  parameters,
  date = new Date(),
  extension = 'wav',
}: FilenameOptions): string {
  // 1. Format video type prefix ('short' | 'long')
  const rawFormat = videoFormat || parameters?.video_format || '';
  const cleanFormat = rawFormat
    ? String(rawFormat).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    : '';

  // 2. Sanitize voice name: remove parentheses, extraneous symbols
  const cleanVoice = voiceName
    .split('(')[0]
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'voice';

  // 3. Format language if provided
  let cleanLang = '';
  if (language) {
    cleanLang = language
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // 4. Extract and format active parameters (speed, pitch, etc.)
  const paramParts: string[] = [];
  if (parameters) {
    const speed = parameters.speed ?? parameters.rate;
    if (speed !== undefined && speed !== null && speed !== '') {
      const numSpeed = typeof speed === 'number' ? speed : parseFloat(speed);
      if (!isNaN(numSpeed)) {
        paramParts.push(`speed${numSpeed}x`);
      }
    }

    Object.entries(parameters).forEach(([key, val]) => {
      if (key === 'speed' || key === 'rate' || key === 'video_format') return;
      if (val !== undefined && val !== null && val !== '') {
        const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');
        const cleanVal = String(val).replace(/[^a-zA-Z0-9.]/g, '');
        if (cleanKey && cleanVal) {
          paramParts.push(`${cleanKey}${cleanVal}`);
        }
      }
    });
  }

  // 5. Format 2-digit hour and 2-digit minute (HHmm)
  let d: Date;
  try {
    d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) d = new Date();
  } catch {
    d = new Date();
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}${minutes}`;

  // Combine into unified slug: <format>_<voice>_<language>_<parameters>_<time>.<ext>
  const parts = [cleanFormat, cleanVoice, cleanLang, ...paramParts, timeStr].filter(Boolean);
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;

  return `${parts.join('_')}.${ext}`;
}
