import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  PokerStateSchema,
  activePlayerIds,
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
  toggleEliminated: (sessionId: string, playerId: string) => void
  toggleZeroed: (sessionId: string, playerId: string) => void
  declareWinner: (sessionId: string, playerId: string) => void
  clearWinner: (sessionId: string) => void
  undoLastHand: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

type PersistedPoker = {
  sessions: Record<string, Record<string, unknown>>
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

function maybeFinishLastStanding(state: PokerState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session || state.winMode !== 'last-standing') return
  const ids = session.players.map((p) => p.id)
  if (activePlayerIds(ids, state).length === 1) {
    useSessionStore.getState().finishSession(state.sessionId)
  }
}

function maybeReopenLastStanding(state: PokerState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session || state.winMode !== 'last-standing') return
  const ids = session.players.map((p) => p.id)
  if (activePlayerIds(ids, state).length > 1) {
    useSessionStore.getState().reopenSession(state.sessionId)
  }
}

function migratePokerState(raw: Record<string, unknown>): PokerState {
  const winMode = raw.winMode === 'target' || raw.winMode === 'rounds' ? 'rounds' : 'last-standing'
  const parsed = PokerStateSchema.parse({
    sessionId: raw.sessionId,
    dealerPlayerId: raw.dealerPlayerId,
    winMode,
    hands: raw.hands ?? [],
    eliminatedPlayerIds: raw.eliminatedPlayerIds ?? [],
    zeroedPlayerIds: raw.zeroedPlayerIds ?? [],
    sessionWinnerId: raw.sessionWinnerId,
  })
  return parsed
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
          hands: [],
          eliminatedPlayerIds: [],
          zeroedPlayerIds: [],
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
        if (!current || current.winMode === winMode) return
        const next: PokerState = {
          ...current,
          winMode,
          eliminatedPlayerIds: winMode === 'rounds' ? [] : current.eliminatedPlayerIds,
          zeroedPlayerIds: winMode === 'last-standing' ? [] : current.zeroedPlayerIds,
          sessionWinnerId: undefined,
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        useSessionStore.getState().reopenSession(sessionId)
        maybeFinishLastStanding(next)
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
        maybeFinishLastStanding(next)
        maybeReopenLastStanding(next)
      },
      toggleZeroed: (sessionId, playerId) => {
        const current = get().sessions[sessionId]
        if (!current || current.winMode !== 'rounds') return
        const zeroed = new Set(current.zeroedPlayerIds)
        if (zeroed.has(playerId)) {
          zeroed.delete(playerId)
        } else {
          zeroed.add(playerId)
        }
        set({
          sessions: patchSession(get().sessions, sessionId, {
            zeroedPlayerIds: [...zeroed],
          }),
        })
      },
      declareWinner: (sessionId, playerId) => {
        const current = get().sessions[sessionId]
        if (!current || current.winMode !== 'rounds') return
        const next: PokerState = { ...current, sessionWinnerId: playerId }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        useSessionStore.getState().finishSession(sessionId)
      },
      clearWinner: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next: PokerState = { ...current, sessionWinnerId: undefined }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        useSessionStore.getState().reopenSession(sessionId)
      },
      undoLastHand: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current || current.hands.length === 0) return
        const next = { ...current, hands: current.hands.slice(0, -1) }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    {
      name: 'pontos-poker',
      version: 2,
      migrate: (persisted) => {
        const data = (persisted ?? { sessions: {} }) as PersistedPoker
        const sessions: Record<string, PokerState> = {}
        for (const [id, raw] of Object.entries(data.sessions ?? {})) {
          sessions[id] = migratePokerState(raw)
        }
        return { sessions }
      },
    },
  ),
)
