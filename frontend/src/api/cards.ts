import { API_ENDPOINTS } from './config';


interface Links {
  [target_id: string]: number;  // weight
}

export interface Card {
  id: string;
  content: string;
  context?: string;
  links?: Links;
}

// Generate timestamp-based ID (format: YYYYMMDDHHmmss)
export const generateCardId = (index?: number): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  let seconds = now.getSeconds();
  if (index !== undefined) {
    seconds = (seconds + index) % 60;  
  }
  const secondsStr = String(seconds).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${secondsStr}`;
};

// Get all cards
export const getCards = async (): Promise<Card[]> => {
  const response = await fetch(API_ENDPOINTS.CARDS);
  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }
  return response.json();
};

// Get single card
export const getCard = async (id: string): Promise<Card> => {
  const response = await fetch(`${API_ENDPOINTS.CARDS}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch card');
  }
  return response.json();
};

// Create new card
export const createCard = async (card: Card): Promise<Card> => {

  const response = await fetch(API_ENDPOINTS.CARDS + '/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(card),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create card');
  }
  return response.json();
};

// Update card
export const updateCard = async (card: Card): Promise<Card> => {
  const response = await fetch(`${API_ENDPOINTS.CARDS}/${card.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(card),
  });
  if (!response.ok) {
    throw new Error('Failed to update card');
  }
  return response.json();
};

// Delete card
export const deleteCard = async (id: string): Promise<void> => {
  const response = await fetch(`${API_ENDPOINTS.CARDS}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete card');
  }
};
