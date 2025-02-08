import { create } from 'zustand';

interface CanvasState {
  scale: number;
  position: { x: number; y: number };
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  scale: 1,
  position: { x: 0, y: 0 },
  setScale: (scale) => set({ scale }),
  setPosition: (x, y) => set({ position: { x, y } }),
})); 