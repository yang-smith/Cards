import { create } from 'zustand'
import { testCards } from '../data/testCards'
import { nanoid } from 'nanoid'
import { Card } from '@/api/cards'

export type CardType = 'atomic' | 'chat' | 'markdown' | 'graph' | 'cardList'

export interface UICard {
  id: string
  type: CardType
  content?: string
  context?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  links?: { [key: string]: number }
  cards?: Card[]
}

interface CardStore {
  uicards: Record<string, UICard>
  addCard: (card: Partial<UICard> & { type: CardType }) => string
  updateCard: (id: string, updates: Partial<UICard>) => void
  removeCard: (id: string) => void
  getCard: (id: string) => UICard | undefined
  getCardsByType: (type: CardType) => UICard[]
  clearCards: () => void
  resetToDefault: () => void
}

export const useCardStore = create<CardStore>((set, get) => ({
  uicards: testCards,
  
  addCard: (card) => {
    const id = card.id || nanoid()
    set((state) => ({
      uicards: {
        ...state.uicards,
        [id]: {
          id,
          content: '',
          position: { x: 0, y: 0 },
          size: { width: 400, height: 300 },
          links: {},
          cards: [],
          ...card,
        }
      }
    }))
    return id
  },
  
  updateCard: (id, updates) => set((state) => ({
    uicards: {
      ...state.uicards,
      [id]: { ...state.uicards[id], ...updates }
    }
  })),
  
  removeCard: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.uicards
    const updatedCards = Object.entries(rest).reduce((acc, [cardId, card]) => {
      if (card.links && card.links[id]) {
        const { [id]: _, ...remainingLinks } = card.links
        acc[cardId] = { ...card, links: remainingLinks }
      } else {
        acc[cardId] = card
      }
      return acc
    }, {} as Record<string, UICard>)
    return { uicards: updatedCards }
  }),
  
  getCard: (id) => get().uicards[id],
  
  getCardsByType: (type) => 
    Object.values(get().uicards).filter(card => card.type === type),
  
  clearCards: () => set({ uicards: {} }),
  
  resetToDefault: () => set({ uicards: testCards })
})) 