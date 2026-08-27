import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_COIN_PRESET,
  matchingPresetId,
  type CoinSideId,
  type CoinPreset,
} from '@/tools/coin-presets'

export type CoinSide = {
  label: string
  image?: string
}

type CoinStore = {
  presetId: string
  a: CoinSide
  b: CoinSide
  applyPreset: (preset: CoinPreset) => void
  setLabel: (side: CoinSideId, label: string) => void
  setImage: (side: CoinSideId, image: string | undefined) => void
}

export const useCoinStore = create<CoinStore>()(
  persist(
    (set, get) => ({
      presetId: DEFAULT_COIN_PRESET.id,
      a: { label: DEFAULT_COIN_PRESET.a },
      b: { label: DEFAULT_COIN_PRESET.b },
      applyPreset: (preset) => {
        set({
          presetId: preset.id,
          a: { label: preset.a, image: undefined },
          b: { label: preset.b, image: undefined },
        })
      },
      setLabel: (side, label) => {
        const current = get()
        const next = { ...current[side], label }
        const a = side === 'a' ? next : current.a
        const b = side === 'b' ? next : current.b
        const matched = matchingPresetId(a.label, b.label)
        const custom = Boolean(a.image || b.image) || !matched
        set({ [side]: next, presetId: custom ? 'custom' : matched })
      },
      setImage: (side, image) => {
        set((state) => {
          const nextSide = { ...state[side], image }
          const a = side === 'a' ? nextSide : state.a
          const b = side === 'b' ? nextSide : state.b
          const matched = matchingPresetId(a.label, b.label)
          const custom = Boolean(a.image || b.image) || !matched
          return {
            [side]: nextSide,
            presetId: custom ? 'custom' : matched,
          }
        })
      },
    }),
    { name: 'pontos-coin', version: 1 },
  ),
)
