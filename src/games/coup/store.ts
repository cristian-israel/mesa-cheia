import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  COUP_DEFAULT_TARGET,
  CoupStateSchema,
  activePlayerIds,
  partidasWon,
  type CoupState,
  type CoupWinMode,
} from '@/games/coup/schema'

type CoupStore = {
  sessions: Record<string, CoupState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => CoupState
  registerPartida: (sessionId: string, winnerPlayerId: string) => void
  nextDealer: (sessionId: string) => void
  setDealer: (sessionId: string, playerId: string) => void
  setWinMode: (sessionId: string, winMode: CoupWinMode) => void
  setTargetPartidas: (sessionId: string, targetPartidas: number) => void
  toggleEliminated: (sessionId: string, playerId: string) => void
  undoLastPartida: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

function patchSession(
  sessions: Record<string, CoupState>,
  sessionId: string,
  patch: Partial<CoupState>,
) {
  const current = sessions[sessionId]
  if (!current) return sessions
  return { ...sessions, [sessionId]: { ...current, ...patch } }
}

function maybeFinish(state: CoupState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session) return
  const ids = session.players.map((p) => p.id)

  if (state.winMode === 'last-standing') {
    if (activePlayerIds(ids, state).length === 1) {
      useSessionStore.getState().finishSession(state.sessionId)
    }
    return
  }

  const won = partidasWon(state)
  const reached = Object.values(won).some((count) => count >= state.targetPartidas)
  if (reached) {
    useSessionStore.getState().finishSession(state.sessionId)
  }
}

function maybeReopen(state: CoupState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session) return
  const ids = session.players.map((p) => p.id)

  if (state.winMode === 'last-standing') {
    if (activePlayerIds(ids, state).length > 1) {
      useSessionStore.getState().reopenSession(state.sessionId)
    }
    return
  }

  const won = partidasWon(state)
  const reached = Object.values(won).some((count) => count >= state.targetPartidas)
  if (!reached) {
    useSessionStore.getState().reopenSession(state.sessionId)
  }
}

export const useCoupStore = create<CoupStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: CoupState = {
          sessionId,
          dealerPlayerId: players[0]?.id ?? '',
          winMode: 'last-standing',
          targetPartidas: COUP_DEFAULT_TARGET,
          partidas: [],
          eliminatedPlayerIds: [],
        }
        const parsed = CoupStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      registerPartida: (sessionId, winnerPlayerId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next: CoupState = {
          ...current,
          partidas: [...current.partidas, { id: createId(), winnerPlayerId }],
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeFinish(next)
      },
      nextDealer: (sessionId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session) return
        const ids = activePlayerIds(
          session.players.map((p) => p.id),
          current,
        )
        if (ids.length === 0) return
        const idx = ids.indexOf(current.dealerPlayerId)
        get().setDealer(sessionId, ids[(idx + 1) % ids.length])
      },
      setDealer: (sessionId, playerId) => {
        set((state) => ({
          sessions: patchSession(state.sessions, sessionId, { dealerPlayerId: playerId }),
        }))
      },
      setWinMode: (sessionId, winMode) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next: CoupState = {
          ...current,
          winMode,
          eliminatedPlayerIds: winMode === 'target' ? [] : current.eliminatedPlayerIds,
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeFinish(next)
        maybeReopen(next)
      },
      setTargetPartidas: (sessionId, targetPartidas) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next = { ...current, targetPartidas }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeFinish(next)
        maybeReopen(next)
      },
      toggleEliminated: (sessionId, playerId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session || current.winMode !== 'last-standing') return
        const out = new Set(current.eliminatedPlayerIds)
        if (out.has(playerId)) {
          out.delete(playerId)
        } else {
          const remaining = session.players.filter((p) => p.id !== playerId && !out.has(p.id))
          if (remaining.length < 1) return
          out.add(playerId)
        }
        const next: CoupState = { ...current, eliminatedPlayerIds: [...out] }
        if (out.has(next.dealerPlayerId)) {
          const ids = activePlayerIds(
            session.players.map((p) => p.id),
            next,
          )
          next.dealerPlayerId = ids[0] ?? next.dealerPlayerId
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeFinish(next)
        maybeReopen(next)
      },
      undoLastPartida: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current || current.partidas.length === 0) return
        const next = { ...current, partidas: current.partidas.slice(0, -1) }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeReopen(next)
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    { name: 'pontos-coup', version: 1 },
  ),
)
