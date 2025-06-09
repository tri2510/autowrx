import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'

type GlobalState = {
  isChatShowed?: boolean
}

type Actions = {
  setIsChatShowed: (value: boolean) => void
}

const useGlobalStore = create<GlobalState & Actions>()(
  immer((set) => ({
    isChatShowed: false,
    setIsChatShowed: (value) =>
      set((state) => {
        state.isChatShowed = value
      })
  }))
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('GlobalStore', useGlobalStore)
}

export default useGlobalStore
