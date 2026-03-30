/**
 * BTS ReflectAI — Ollama API Layer
 */

const BASE_URL = 'http://ml01.alignedautomation.com:11434/api/generate';
const MODEL = 'gpt-oss';

/**
 * Stream a response token-by-token.
 */
export async function streamResponse(prompt, onToken, signal) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, stream: true }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.response) {
          full += data.response;
          onToken(data.response);
        }
        if (data.done) return full;
      } catch {
        /* partial JSON line — skip */
      }
    }
  }

  return full;
}

/**
 * Generate a complete response (non-streaming).
 */
export async function generateResponse(prompt, signal) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, stream: false }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  return data.response || '';
}
