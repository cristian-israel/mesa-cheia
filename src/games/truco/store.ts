import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  TRUCO_DEFAULT_TARGET,
  TrucoStateSchema,
  teamTotals,
  type TrucoState,
} from '@/games/truco/schema'

type TrucoStore = {
  sessions: Record<string, TrucoState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => TrucoState
  applyDelta: (sessionId: string, sideId: string, delta: number, label: string) => void
  nextDealer: (sessionId: string) => void
  setDealer: (sessionId: string, playerId: string) => void
  setTargetScore: (sessionId: string, targetScore: number) => void
  undoLast: (sessionId: string) => void
  undoEvent: (sessionId: string, eventId: string) => void
  deleteSession: (sessionId: string) => void
}

function patchSession(
  sessions: Record<string, TrucoState>,
  sessionId: string,
  patch: Partial<TrucoState>,
) {
  const current = sessions[sessionId]
  if (!current) return sessions
  return { ...sessions, [sessionId]: { ...current, ...patch } }
}

function syncSessionStatus(state: TrucoState) {
  const reached = Object.values(teamTotals(state)).some((score) => score >= state.targetScore)
  const session = useSessionStore.getState()
  if (reached) session.finishSession(state.sessionId)
  else session.reopenSession(state.sessionId)
}

export const useTrucoStore = create<TrucoStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: TrucoState = {
          sessionId,
          targetScore: TRUCO_DEFAULT_TARGET,
          dealerPlayerId: players[0]?.id ?? '',
          events: [],
        }
        const parsed = TrucoStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      applyDelta: (sessionId, sideId, delta, label) => {
        const current = get().sessions[sessionId]
        if (!current || delta === 0) return
        const totals = teamTotals(current)
        const score = totals[sideId] ?? 0
        const nextScore = score + delta
        const clamped = nextScore < 0 ? -score : delta
        if (clamped === 0) return
        const next: TrucoState = {
          ...current,
          events: [
            ...current.events,
            { id: createId(), sideId, label, delta: clamped },
          ],
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      nextDealer: (sessionId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session) return
        const ids = session.players.map((p) => p.id)
        if (ids.length === 0) return
        const idx = Math.max(0, ids.indexOf(current.dealerPlayerId))
        get().setDealer(sessionId, ids[(idx + 1) % ids.length])
      },
      setDealer: (sessionId, playerId) => {
        set((state) => ({
          sessions: patchSession(state.sessions, sessionId, { dealerPlayerId: playerId }),
        }))
      },
      setTargetScore: (sessionId, targetScore) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next = { ...current, targetScore }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      undoLast: (sessionId) => {
        const current = get().sessions[sessionId]
        const last = current?.events.at(-1)
        if (!last) return
        get().undoEvent(sessionId, last.id)
      },
      undoEvent: (sessionId, eventId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next = { ...current, events: current.events.filter((event) => event.id !== eventId) }
        if (next.events.length === current.events.length) return
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    { name: 'pontos-truco', version: 1 },
  ),
)
