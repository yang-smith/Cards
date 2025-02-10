import { API_ENDPOINTS } from './config.ts';
import { createAtomicCardsPrompt } from '@/prompt/prompt';

export const createChatStream = (message: string): EventSource => {
  const url = `${API_ENDPOINTS.CHAT_STREAM}?message=${encodeURIComponent(message)}`;
  return new EventSource(url);
};

export const atomizeContent = async (content: string): Promise<string> => {
  const response = await fetch(`${API_ENDPOINTS.ATOMIZE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: createAtomicCardsPrompt(content) })
  });
  const data = await response.json();
  return data.content;
}; 