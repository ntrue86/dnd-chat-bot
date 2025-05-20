import * as fs from 'fs';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const OPENAI_TTS_INSTRUCTIONS = process.env.OPENAI_TTS_INSTRUCTIONS || '';

export async function textToSpeech(text: string, outputPath: string, options?: {
  model?: string;
  voice?: string;
  response_format?: string;
  speed?: number;
  instructions?: string;
  // Add more custom options as OpenAI supports them
}) {
  const fetch = (await import('node-fetch')).default;
  const body = {
    model: options?.model || 'gpt-4o-mini-tts',
    input: text,
    voice: options?.voice || 'ballad',
    instructions: options?.instructions || OPENAI_TTS_INSTRUCTIONS || undefined,
    response_format: options?.response_format || 'mp3',
    ...(options?.speed ? { speed: options.speed } : {})
  };
  const response = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`OpenAI TTS API error: ${response.status} ${await response.text()}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}
