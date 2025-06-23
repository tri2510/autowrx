import { create } from 'zustand'
import mockRequirements, { mockAIRequirements } from '../mockup_requirements'

interface RequirementState {
  // Scanning state
  isScanning: boolean
  startScanning: () => void
  stopScanning: () => void
  toggleScanning: () => void

  // Requirements data
  requirements: typeof mockRequirements
  setRequirements: (requirements: typeof mockRequirements) => void
  applyAISuggestions: () => void
}

export const useRequirementStore = create<RequirementState>((set) => ({
  // Scanning state management
  isScanning: false,
  startScanning: () => set({ isScanning: true }),
  stopScanning: () => set({ isScanning: false }),
  toggleScanning: () => set((state) => ({ isScanning: !state.isScanning })),

  // Requirements data management
  requirements: mockRequirements,
  setRequirements: (requirements) => set({ requirements }),
  applyAISuggestions: () => set({ requirements: mockAIRequirements }),
}))
