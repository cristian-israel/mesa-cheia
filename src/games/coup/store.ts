import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  CoupStateSchema,
  activePlayerIds,
  currentPartidaNumber,
  type CoupState,
} from '@/games/coup/schema'

type CoupStore = {
  sessions: Record<string, CoupState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => CoupState
  markOut: (sessionId: string, playerId: string) => void
  undoOut: (sessionId: string, playerId: string) => void
  startNextPartida: (sessionId: string) => void
  undoLastEvent: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

function maybeFinishRound(state: CoupState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session) return state

  const ids = session.players.map((p) => p.id)
  const alive = activePlayerIds(ids, state)
  if (alive.length !== 1) return state

  const winnerPlayerId = alive[0]
  const partidaNumber = currentPartidaNumber(state)
  const next: CoupState = {
    ...state,
    partidas: [
      ...state.partidas,
      {
        id: createId(),
        winnerPlayerId,
        outs: [...state.eliminatedPlayerIds],
      },
    ],
    events: [
      ...state.events,
      {
        id: createId(),
        kind: 'win',
        playerId: winnerPlayerId,
        partidaNumber,
      },
    ],
  }
  useSessionStore.getState().finishSession(state.sessionId)
  return next
}

function nextStarter(playerIds: string[], currentId: string) {
  if (playerIds.length === 0) return currentId
  const idx = playerIds.indexOf(currentId)
  return playerIds[(idx + 1) % playerIds.length] ?? playerIds[0]
}

export const useCoupStore = create<CoupStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: CoupState = {
          sessionId,
          starterPlayerId: players[0]?.id ?? '',
          eliminatedPlayerIds: [],
          partidas: [],
          events: [],
        }
        const parsed = CoupStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      markOut: (sessionId, playerId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session || session.status === 'finished') return
        if (current.eliminatedPlayerIds.includes(playerId)) return

        const remaining = session.players.filter(
          (p) => p.id !== playerId && !current.eliminatedPlayerIds.includes(p.id),
        )
        if (remaining.length < 1) return

        let next: CoupState = {
          ...current,
          eliminatedPlayerIds: [...current.eliminatedPlayerIds, playerId],
          events: [
            ...current.events,
            {
              id: createId(),
              kind: 'out',
              playerId,
              partidaNumber: currentPartidaNumber(current),
            },
          ],
        }
        if (next.eliminatedPlayerIds.includes(next.starterPlayerId)) {
          const alive = activePlayerIds(
            session.players.map((p) => p.id),
            next,
          )
          next = { ...next, starterPlayerId: alive[0] ?? next.starterPlayerId }
        }
        next = maybeFinishRound(next)
        set({ sessions: { ...get().sessions, [sessionId]: next } })
      },
      undoOut: (sessionId, playerId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session || session.status === 'finished') return
        if (!current.eliminatedPlayerIds.includes(playerId)) return

        const outIndex = [...current.events]
          .reverse()
          .findIndex((event) => event.kind === 'out' && event.playerId === playerId)
        if (outIndex < 0) return
        const absolute = current.events.length - 1 - outIndex
        const next: CoupState = {
          ...current,
          eliminatedPlayerIds: current.eliminatedPlayerIds.filter((id) => id !== playerId),
          events: current.events.filter((_, index) => index !== absolute),
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
      },
      startNextPartida: (sessionId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session) return

        const ids = session.players.map((p) => p.id)
        const partidaNumber = currentPartidaNumber(current)
        const roundClosed = session.status === 'finished'

        // Mid-round reset: drop this partida's outs from the history
        const events = roundClosed
          ? current.events
          : current.events.filter(
              (event) => !(event.kind === 'out' && event.partidaNumber === partidaNumber),
            )

        const next: CoupState = {
          ...current,
          events,
          eliminatedPlayerIds: [],
          starterPlayerId: nextStarter(ids, current.starterPlayerId),
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        useSessionStore.getState().reopenSession(sessionId)
      },
      undoLastEvent: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current || current.events.length === 0) return
        const last = current.events[current.events.length - 1]
        const events = current.events.slice(0, -1)

        if (last.kind === 'win') {
          const undone = current.partidas.at(-1)
          const next: CoupState = {
            ...current,
            events,
            partidas: current.partidas.slice(0, -1),
            eliminatedPlayerIds: undone?.outs ?? [],
          }
          set({ sessions: { ...get().sessions, [sessionId]: next } })
          useSessionStore.getState().reopenSession(sessionId)
          return
        }

        const next: CoupState = {
          ...current,
          events,
          eliminatedPlayerIds: current.eliminatedPlayerIds.filter((id) => id !== last.playerId),
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    {
      name: 'pontos-coup',
      version: 2,
      migrate: () => ({ sessions: {} }),
    },
  ),
)
