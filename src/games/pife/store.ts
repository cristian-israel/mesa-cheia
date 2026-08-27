import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  PIFE_DEFAULT_TARGET,
  PifeStateSchema,
  pifesWon,
  type PifeState,
} from '@/games/pife/schema'

type PifeStore = {
  sessions: Record<string, PifeState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => PifeState
  registerPife: (sessionId: string, winnerPlayerId: string) => void
  nextDealer: (sessionId: string) => void
  setDealer: (sessionId: string, playerId: string) => void
  setTargetScore: (sessionId: string, targetScore: number) => void
  undoLast: (sessionId: string) => void
  undoRound: (sessionId: string, roundId: string) => void
  deleteSession: (sessionId: string) => void
}

function patchSession(
  sessions: Record<string, PifeState>,
  sessionId: string,
  patch: Partial<PifeState>,
) {
  const current = sessions[sessionId]
  if (!current) return sessions
  return { ...sessions, [sessionId]: { ...current, ...patch } }
}

function syncSessionStatus(state: PifeState) {
  const reached = Object.values(pifesWon(state)).some((score) => score >= state.targetScore)
  const session = useSessionStore.getState()
  if (reached) session.finishSession(state.sessionId)
  else session.reopenSession(state.sessionId)
}

export const usePifeStore = create<PifeStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: PifeState = {
          sessionId,
          targetScore: PIFE_DEFAULT_TARGET,
          dealerPlayerId: players[0]?.id ?? '',
          rounds: [],
        }
        const parsed = PifeStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      registerPife: (sessionId, winnerPlayerId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next: PifeState = {
          ...current,
          rounds: [...current.rounds, { id: createId(), winnerPlayerId }],
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
        const last = current?.rounds.at(-1)
        if (!last) return
        get().undoRound(sessionId, last.id)
      },
      undoRound: (sessionId, roundId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next = { ...current, rounds: current.rounds.filter((round) => round.id !== roundId) }
        if (next.rounds.length === current.rounds.length) return
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    { name: 'pontos-pife', version: 1 },
  ),
)
