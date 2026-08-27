import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  CANASTRA_DEFAULT_TARGET,
  CanastraStateSchema,
  defaultBuracoScore,
  teamTotals,
  type CanastraState,
} from '@/games/canastra/schema'

type CanastraStore = {
  sessions: Record<string, CanastraState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => CanastraState
  registerRound: (
    sessionId: string,
    teamScores: Record<string, number>,
    winnerTeamId?: string,
  ) => void
  nextDealer: (sessionId: string) => void
  setDealer: (sessionId: string, playerId: string) => void
  setTargetScore: (sessionId: string, targetScore: number) => void
  setBuracoEnabled: (sessionId: string, enabled: boolean) => void
  setBuracoScore: (sessionId: string, buracoScore: number) => void
  undoLastRound: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

type PersistedCanastra = { sessions: Record<string, Partial<CanastraState> & { sessionId?: string }> }

function maybeFinish(state: CanastraState) {
  const totals = teamTotals(state)
  const reached = Object.values(totals).some((score) => score >= state.targetScore)
  if (reached) {
    useSessionStore.getState().finishSession(state.sessionId)
  }
}

function patchSession(
  sessions: Record<string, CanastraState>,
  sessionId: string,
  patch: Partial<CanastraState>,
) {
  const current = sessions[sessionId]
  if (!current) return sessions
  return { ...sessions, [sessionId]: { ...current, ...patch } }
}

export const useCanastraStore = create<CanastraStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const targetScore = CANASTRA_DEFAULT_TARGET
        const state: CanastraState = {
          sessionId,
          targetScore,
          buracoEnabled: true,
          buracoScore: defaultBuracoScore(targetScore),
          dealerPlayerId: players[0]?.id ?? '',
          rounds: [],
        }
        const parsed = CanastraStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      registerRound: (sessionId, teamScores, winnerTeamId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const next: CanastraState = {
          ...current,
          rounds: [...current.rounds, { id: createId(), teamScores, winnerTeamId }],
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeFinish(next)
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
        const wasDefault = current.buracoScore === defaultBuracoScore(current.targetScore)
        const next: CanastraState = {
          ...current,
          targetScore,
          buracoScore: wasDefault ? defaultBuracoScore(targetScore) : current.buracoScore,
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        maybeFinish(next)
      },
      setBuracoEnabled: (sessionId, buracoEnabled) => {
        set((state) => ({
          sessions: patchSession(state.sessions, sessionId, { buracoEnabled }),
        }))
      },
      setBuracoScore: (sessionId, buracoScore) => {
        set((state) => ({
          sessions: patchSession(state.sessions, sessionId, { buracoScore }),
        }))
      },
      undoLastRound: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current || current.rounds.length === 0) return
        const next = { ...current, rounds: current.rounds.slice(0, -1) }
        set({
          sessions: { ...get().sessions, [sessionId]: next },
        })
        const totals = teamTotals(next)
        const reached = Object.values(totals).some((score) => score >= next.targetScore)
        if (!reached) {
          useSessionStore.getState().reopenSession(sessionId)
        }
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    {
      name: 'pontos-canastra',
      version: 2,
      migrate: (persisted, version) => {
        const data = persisted as PersistedCanastra
        if (version < 2) {
          for (const session of Object.values(data.sessions ?? {})) {
            const target =
              typeof session.targetScore === 'number' ? session.targetScore : CANASTRA_DEFAULT_TARGET
            if (session.buracoEnabled === undefined) session.buracoEnabled = true
            if (session.buracoScore === undefined) session.buracoScore = defaultBuracoScore(target)
          }
        }
        return data as CanastraStore
      },
    },
  ),
)
