import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  PONTINHOS_DEFAULT_TARGET,
  PontinhosStateSchema,
  playerTotals,
  type PontinhosState,
} from '@/games/pontinhos/schema'

type PontinhosStore = {
  sessions: Record<string, PontinhosState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => PontinhosState
  registerRound: (
    sessionId: string,
    scores: Record<string, number>,
    winnerPlayerId?: string,
  ) => void
  nextDealer: (sessionId: string) => void
  setDealer: (sessionId: string, playerId: string) => void
  setTargetScore: (sessionId: string, targetScore: number) => void
  undoRound: (sessionId: string, roundId: string) => void
  deleteSession: (sessionId: string) => void
}

function patchSession(
  sessions: Record<string, PontinhosState>,
  sessionId: string,
  patch: Partial<PontinhosState>,
) {
  const current = sessions[sessionId]
  if (!current) return sessions
  return { ...sessions, [sessionId]: { ...current, ...patch } }
}

function syncSessionStatus(state: PontinhosState) {
  const reached = Object.values(playerTotals(state)).some((score) => score >= state.targetScore)
  const session = useSessionStore.getState()
  if (reached) session.finishSession(state.sessionId)
  else session.reopenSession(state.sessionId)
}

export const usePontinhosStore = create<PontinhosStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: PontinhosState = {
          sessionId,
          targetScore: PONTINHOS_DEFAULT_TARGET,
          dealerPlayerId: players[0]?.id ?? '',
          rounds: [],
        }
        const parsed = PontinhosStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      registerRound: (sessionId, scores, winnerPlayerId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next: PontinhosState = {
          ...current,
          rounds: [...current.rounds, { id: createId(), scores, winnerPlayerId }],
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
    { name: 'pontos-pontinhos', version: 1 },
  ),
)
