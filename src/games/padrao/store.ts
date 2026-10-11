import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  PADRAO_DEFAULT_ROUNDS_TARGET,
  PADRAO_DEFAULT_TARGET,
  PadraoStateSchema,
  hasReachedTarget,
  sideTotals,
  type PadraoScoreMode,
  type PadraoState,
  type PadraoTargetRule,
} from '@/games/padrao/schema'

type PadraoStore = {
  sessions: Record<string, PadraoState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => PadraoState
  applyDelta: (sessionId: string, sideId: string, delta: number, label: string) => void
  nextDealer: (sessionId: string) => void
  previousDealer: (sessionId: string) => void
  setDealer: (sessionId: string, playerId: string) => void
  setTargetScore: (sessionId: string, targetScore: number) => void
  setScoreMode: (sessionId: string, scoreMode: PadraoScoreMode) => void
  setTargetRule: (sessionId: string, targetRule: PadraoTargetRule) => void
  undoEvent: (sessionId: string, eventId: string) => void
  deleteSession: (sessionId: string) => void
}

type PersistedPadrao = {
  sessions: Record<string, Partial<PadraoState> & { sessionId?: string }>
}

function patchSession(
  sessions: Record<string, PadraoState>,
  sessionId: string,
  patch: Partial<PadraoState>,
) {
  const current = sessions[sessionId]
  if (!current) return sessions
  return { ...sessions, [sessionId]: { ...current, ...patch } }
}

function syncSessionStatus(state: PadraoState) {
  const session = useSessionStore.getState()
  if (hasReachedTarget(state)) session.finishSession(state.sessionId)
  else session.reopenSession(state.sessionId)
}

function migratePadraoState(raw: Record<string, unknown>): PadraoState {
  return PadraoStateSchema.parse({
    sessionId: raw.sessionId,
    targetScore: raw.targetScore ?? PADRAO_DEFAULT_TARGET,
    dealerPlayerId: raw.dealerPlayerId ?? '',
    scoreMode: raw.scoreMode === 'points' ? 'points' : 'rounds',
    targetRule: raw.targetRule === 'lose' ? 'lose' : 'win',
    events: raw.events ?? [],
  })
}

export const usePadraoStore = create<PadraoStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: PadraoState = {
          sessionId,
          targetScore: PADRAO_DEFAULT_ROUNDS_TARGET,
          dealerPlayerId: players[0]?.id ?? '',
          scoreMode: 'rounds',
          targetRule: 'win',
          events: [],
        }
        const parsed = PadraoStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      applyDelta: (sessionId, sideId, delta, label) => {
        const current = get().sessions[sessionId]
        if (!current || delta === 0) return
        const score = sideTotals(current)[sideId] ?? 0
        const nextScore = score + delta
        const clamped = nextScore < 0 ? -score : delta
        if (clamped === 0) return
        const next: PadraoState = {
          ...current,
          events: [...current.events, { id: createId(), sideId, label, delta: clamped }],
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
      previousDealer: (sessionId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session) return
        const ids = session.players.map((p) => p.id)
        if (ids.length === 0) return
        const idx = Math.max(0, ids.indexOf(current.dealerPlayerId))
        get().setDealer(sessionId, ids[(idx - 1 + ids.length) % ids.length])
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
      setScoreMode: (sessionId, scoreMode) => {
        const current = get().sessions[sessionId]
        if (!current || current.scoreMode === scoreMode) return
        const next: PadraoState = {
          ...current,
          scoreMode,
          targetRule: scoreMode === 'rounds' ? 'win' : current.targetRule,
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      setTargetRule: (sessionId, targetRule) => {
        const current = get().sessions[sessionId]
        if (!current || current.scoreMode !== 'points' || current.targetRule === targetRule) return
        const next = { ...current, targetRule }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      undoEvent: (sessionId, eventId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const index = current.events.findIndex((event) => event.id === eventId)
        if (index < 0) return
        const removed = current.events[index]
        const wasLast = index === current.events.length - 1
        const next = {
          ...current,
          events: current.events.filter((event) => event.id !== eventId),
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        // Lançar pontos avança o dealer uma vez por lote de "Rodada".
        if (wasLast && removed.label === 'Rodada' && next.events.at(-1)?.label !== 'Rodada') {
          get().previousDealer(sessionId)
        }
        syncSessionStatus(next)
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    {
      name: 'pontos-padrao',
      version: 2,
      migrate: (persisted) => {
        const data = (persisted ?? { sessions: {} }) as PersistedPadrao
        const sessions: Record<string, PadraoState> = {}
        for (const [id, raw] of Object.entries(data.sessions ?? {})) {
          // Partidas antigas tinham +/- e lançar pontos com alvo = vitória.
          sessions[id] = migratePadraoState({
            ...raw,
            scoreMode: raw.scoreMode ?? 'points',
            targetRule: raw.targetRule ?? 'win',
          })
        }
        return { sessions }
      },
    },
  ),
)
