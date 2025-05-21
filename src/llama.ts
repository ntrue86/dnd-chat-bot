import fetch from 'node-fetch';
import 'dotenv/config';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export async function generateLlamaResponse(prompt: string): Promise<string> {
  // Debug: log the request body
  const requestBody = {
    model: OLLAMA_MODEL,
    prompt,
    stream: false
  };
  console.log('[Ollama] Request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Ollama] Error ${response.status}:`, errorText);
    throw new Error(`Ollama API error: ${response.status} ${errorText}`);
  }
  const data = await response.json();
  // Debug: log the response
  console.log('[Ollama] Response:', JSON.stringify(data.response, null, 2));
  return data.response?.trim() || '';
}
