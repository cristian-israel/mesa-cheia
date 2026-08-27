import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  POKER_DEFAULT_TARGET,
  PokerStateSchema,
  activePlayerIds,
  mesasWon,
  type PokerState,
  type PokerWinMode,
} from '@/games/poker/schema'

type PokerStore = {
  sessions: Record<string, PokerState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => PokerState
  registerHand: (sessionId: string, winnerPlayerId: string) => void
  nextDealer: (sessionId: string) => void
  setDealer: (sessionId: string, playerId: string) => void
  setWinMode: (sessionId: string, winMode: PokerWinMode) => void
  setTargetMesas: (sessionId: string, targetMesas: number) => void
  toggleEliminated: (sessionId: string, playerId: string) => void
  undoLastHand: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

function patchSession(
  sessions: Record<string, PokerState>,
  sessionId: string,
  patch: Partial<PokerState>,
) {
  const current = sessions[sessionId]
  if (!current) return sessions
  return { ...sessions, [sessionId]: { ...current, ...patch } }
}

function maybeFinish(state: PokerState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session) return
  const ids = session.players.map((p) => p.id)

  if (state.winMode === 'last-standing') {
    if (activePlayerIds(ids, state).length === 1) {
      useSessionStore.getState().finishSession(state.sessionId)
    }
    return
  }

  const won = mesasWon(state)
  const reached = Object.values(won).some((count) => count >= state.targetMesas)
  if (reached) {
    useSessionStore.getState().finishSession(state.sessionId)
  }
}

function maybeReopen(state: PokerState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session) return
  const ids = session.players.map((p) => p.id)

  if (state.winMode === 'last-standing') {
    if (activePlayerIds(ids, state).length > 1) {
      useSessionStore.getState().reopenSession(state.sessionId)
    }
    return
  }

  const won = mesasWon(state)
  const reached = Object.values(won).some((count) => count >= state.targetMesas)
  if (!reached) {
    useSessionStore.getState().reopenSession(state.sessionId)
  }
}

export const usePokerStore = create<PokerStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: PokerState = {
          sessionId,
          dealerPlayerId: players[0]?.id ?? '',
          winMode: 'last-standing',
          targetMesas: POKER_DEFAULT_TARGET,
          hands: [],
          eliminatedPlayerIds: [],
        }
        const parsed = PokerStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      registerHand: (sessionId, winnerPlayerId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next: PokerState = {
          ...current,
          hands: [...current.hands, { id: createId(), winnerPlayerId }],
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
        const next: PokerState = {
          ...current,
          winMode,
          eliminatedPlayerIds: winMode === 'target' ? [] : current.eliminatedPlayerIds,
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeFinish(next)
        maybeReopen(next)
      },
      setTargetMesas: (sessionId, targetMesas) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next = { ...current, targetMesas }
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
        const next: PokerState = { ...current, eliminatedPlayerIds: [...out] }
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
      undoLastHand: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current || current.hands.length === 0) return
        const next = { ...current, hands: current.hands.slice(0, -1) }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeReopen(next)
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    { name: 'pontos-poker', version: 1 },
  ),
)
