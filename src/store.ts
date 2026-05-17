import { create } from 'zustand';

// Tool types available in the simulation
export type Tool = 'scope' | 'doppler' | 'dissector' | 'suction' | 'drill';
export type Step = 'MAPPING' | 'INCISION' | 'RESECTION' | 'CLOSURE';

// Exported tools array for UI consistency (single source of truth)
export const AVAILABLE_TOOLS: readonly Tool[] = ['doppler', 'dissector', 'suction', 'drill'] as const;

// Game configuration constants
export const RESECTION_COMPLETION_COUNT = 40;

interface GameState {
  step: Step;
  activeTool: Tool;
  bloodLevel: number; // 0-100%
  wallResectedCount: number; // Progress tracking
  feedback: string;
  feedbackType: 'neutral' | 'success' | 'critical';

  setStep: (s: Step) => void;
  setTool: (t: Tool) => void;
  addTrauma: (amount: number) => void;
  reduceBlood: (amount: number) => void;
  incrementResection: () => void;
  setFeedback: (msg: string, type: 'neutral' | 'success' | 'critical') => void;
}

export const useGameStore = create<GameState>((set) => ({
  step: 'MAPPING',
  activeTool: 'scope',
  bloodLevel: 0,
  wallResectedCount: 0,
  feedback: 'Step 1: Map the Carotid Siphon with Doppler',
  feedbackType: 'neutral',

  setStep: (s) => set({ step: s }),
  setTool: (t) => set({ activeTool: t }),

  addTrauma: (amount) =>
    set((state) => {
      const newLevel = Math.min(100, state.bloodLevel + amount);
      if (newLevel > 90 && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([200, 100, 200]);
      }
      return { bloodLevel: newLevel };
    }),

  reduceBlood: (amount) => set((state) => ({ bloodLevel: Math.max(0, state.bloodLevel - amount) })),

  incrementResection: () =>
    set((state) => {
      const count = state.wallResectedCount + 1;
      if (count > RESECTION_COMPLETION_COUNT && state.step === 'RESECTION') {
        return {
          wallResectedCount: count,
          step: 'CLOSURE',
          feedback: 'Tumor Exposed. Proceed to Closure.',
          feedbackType: 'success'
        };
      }
      return { wallResectedCount: count };
    }),

  setFeedback: (msg, type) => set({ feedback: msg, feedbackType: type })
}));

export const inputRefs = {
  leftHand: { x: 0, y: 0, z: 0, rot: 0 },
  rightHand: { x: 0, y: 0, z: 0, pinch: false },
  wallGrid: new Float32Array(100).fill(1.0)
};
