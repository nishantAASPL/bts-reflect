/**
 * BTS ReflectAI — OpenAI API Layer
 */

import OpenAI from "openai";

const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const deploymentName = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;
const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;

const openai = new OpenAI({
  baseURL: endpoint,
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
});

/**
 * Stream a response token-by-token.
 */
export async function streamResponse(prompt, onToken, signal) {
  const runner = await openai.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: deploymentName,
      stream: true,
    },
    { signal }
  );

  let full = '';
  for await (const chunk of runner) {
    const delta = chunk.choices[0]?.delta?.content || "";
    full += delta;
    if (delta) {
      onToken(delta);
    }
  }

  return full;
}

/**
 * Generate a complete response (non-streaming).
 */
export async function generateResponse(prompt, signal) {
  const completion = await openai.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: deploymentName,
    },
    { signal }
  );

  return completion.choices[0]?.message?.content || "";
}
