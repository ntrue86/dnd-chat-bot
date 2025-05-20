import { LLama } from '@llama-node/llama-cpp';

const LLAMA_MODEL_PATH = process.env.LLAMA_MODEL_PATH || './llama-model.bin';

let llama: LLama | null = null;
(async () => {
  llama = await LLama.load({ modelPath: LLAMA_MODEL_PATH }, false);
})();

export async function generateLlamaResponse(prompt: string): Promise<string> {
  if (!llama) throw new Error('Llama model not loaded yet.');
  return new Promise((resolve, reject) => {
    let output = '';
    llama!.inference({ prompt, nThreads: 1, nTokPredict: 100 }, (result) => {
      if (result.type === 'Data' && result.data) {
        output += result.data.token;
      } else if (result.type === 'End') {
        resolve(output.trim());
      } else if (result.type === 'Error') {
        reject(result.message);
      }
    });
  });
}
