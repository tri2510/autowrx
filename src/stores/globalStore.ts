// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
