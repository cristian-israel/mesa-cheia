import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import type { Player } from '@/schemas/session'

type RosterState = {
  players: Player[]
  addPlayer: (name: string) => Player
  removePlayer: (id: string) => void
}

export const useRosterStore = create<RosterState>()(
  persist(
    (set, get) => ({
      players: [],
      addPlayer: (name) => {
        const trimmed = name.trim()
        const existing = get().players.find(
          (p) => p.name.localeCompare(trimmed, 'pt-BR', { sensitivity: 'accent' }) === 0,
        )
        if (existing) return existing
        const player: Player = { id: createId(), name: trimmed }
        set({ players: [...get().players, player] })
        return player
      },
      removePlayer: (id) => {
        set({ players: get().players.filter((p) => p.id !== id) })
      },
    }),
    { name: 'pontos-roster', version: 1 },
  ),
)
