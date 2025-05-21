import fetch from 'node-fetch';
import 'dotenv/config';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export async function generateLlamaResponse(prompt: string): Promise<string> {
  const response = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    })
  });
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.response?.trim() || '';
}
