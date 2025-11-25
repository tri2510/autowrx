import { createWithEqualityFn } from 'zustand/traditional'

interface RefStore {
  value: Record<string, HTMLElement[]>
  setValue: (key: string, refs: HTMLElement[]) => void
}

const useRefStore = createWithEqualityFn<RefStore>((set) => ({
  value: {},
  setValue: (key, refs) =>
    set((state) => ({
      value: { ...state.value, [key]: refs },
    })),
}))

export default useRefStore
