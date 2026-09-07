import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import kokoroVoices from '../app/data/kokoroVoices.json';

const SAMPLE_TEXT_MAP: Record<string, string> = {
  'en-US': 'Hello! This is a preview of my voice using Kokoro TTS.',
  'en-GB': 'Hello! This is a preview of my British English voice.',
  'es': '¡Hola! Esta es una muestra de mi voz en español.',
  'fr-FR': 'Bonjour! Ceci est un échantillon de ma voix en français.',
  'hi': 'नमस्ते! यह मेरी आवाज़ का एक नमूना है।',
  'it': 'Ciao! Questo è un campione della mia voce in italiano.',
  'ja': 'こんにちは！これは私の声のサンプルです。',
  'pt': 'Olá! Esta é uma amostra da minha voz em português.',
  'zh-CN': 'Hello! This is a preview of my Mandarin Chinese voice using Kokoro TTS.',
};

async function generateSample(voiceId: string, lang: string, text: string) {
  const outputDir = join(process.cwd(), 'app', 'voice_samples');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, `${voiceId}.wav`);
  if (existsSync(outputPath)) {
    console.log(`  - ${voiceId}.wav already exists. Skipping.`);
    return true;
  }

  console.log(`Generating sample for ${voiceId}...`);

  try {
    const targetLang = lang.toLowerCase().startsWith('zh') ? 'en-us' : lang.toLowerCase();
    const response = await fetch('http://localhost:8000/api/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: voiceId,
        speed: 1.0,
        lang: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log(`  ✓ Saved ${voiceId}.wav (${arrayBuffer.byteLength} bytes)`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed for ${voiceId}:`, error);
    return false;
  }
}

async function main() {
  const allVoices = [
    ...kokoroVoices.americanEnglish,
    ...kokoroVoices.britishEnglish,
    ...kokoroVoices.spanish,
    ...kokoroVoices.french,
    ...kokoroVoices.hindi,
    ...kokoroVoices.italian,
    ...kokoroVoices.japanese,
    ...kokoroVoices.portuguese,
    ...kokoroVoices.mandarinChinese,
  ];

  console.log(`\n🎙️  Checking and generating voice samples for ${allVoices.length} voices...\n`);

  let generated = 0;
  for (const v of allVoices) {
    const text = SAMPLE_TEXT_MAP[v.language] || SAMPLE_TEXT_MAP['en-US'];
    const success = await generateSample(v.voice_id, v.language, text);
    if (success) generated++;
  }

  console.log(`\n✅ Completed! Total voices: ${generated}/${allVoices.length}`);
}

main().catch(console.error);
