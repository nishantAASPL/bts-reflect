/**
 * Utility functions for BTS ReflectAI
 */

const API_URL = 'http://ml01.alignedautomation.com:11434/api/generate';

/**
 * Generate dynamic greeting based on time and context
 */
export async function generateDynamicGreeting() {
  const hour = new Date().getHours();
  let timeContext = 'morning';
  if (hour >= 12 && hour < 17) timeContext = 'afternoon';
  if (hour >= 17) timeContext = 'evening';

  const prompt = `Generate a warm, professional, and friendly single-sentence greeting for someone starting a work reflection session in the ${timeContext}.
Keep it under 20 words. No quotation marks. Just the greeting text.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-oss',
        prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate greeting');
    const data = await response.json();
    return data.response?.trim() || null;
  } catch (error) {
    console.error('Error generating greeting:', error);
    return null;
  }
}

/**
 * Generate contextual encouragement based on input
 */
export async function generateEncouragement(input) {
  const prompt = `The user just shared about their work: "${input.slice(0, 100)}..."
Generate a single encouraging, brief acknowledgment (under 15 words) that validates their input and keeps the conversation moving forward.
No quotation marks. Just the text.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-oss',
        prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate encouragement');
    const data = await response.json();
    return data.response?.trim() || null;
  } catch (error) {
    console.error('Error generating encouragement:', error);
    return null;
  }
}

/**
 * Smooth scroll to element with offset
 */
export function smoothScrollTo(element, offset = 0) {
  if (!element) return;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Debounce function for optimization
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format timestamp to readable string
 */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
