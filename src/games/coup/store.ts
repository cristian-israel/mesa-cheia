import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { scoringSides } from '@/lib/teams'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'
import {
  COUP_DEFAULT_TARGET,
  CoupStateSchema,
  activeSides,
  currentPartidaNumber,
  isRoundClosed,
  playerSideId,
  reachedTarget,
  type CoupState,
} from '@/games/coup/schema'

type CoupStore = {
  sessions: Record<string, CoupState>
  createSession: (sessionId: string, players: Player[], teams?: Team[]) => CoupState
  markOut: (sessionId: string, sideId: string) => void
  undoOut: (sessionId: string, sideId: string) => void
  startNextPartida: (sessionId: string) => void
  setTargetPartidas: (sessionId: string, targetPartidas: number) => void
  undoLastEvent: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

function syncSessionStatus(state: CoupState) {
  if (reachedTarget(state)) {
    useSessionStore.getState().finishSession(state.sessionId)
  } else {
    useSessionStore.getState().reopenSession(state.sessionId)
  }
}

function maybeCloseRound(state: CoupState) {
  const session = useSessionStore.getState().sessions[state.sessionId]
  if (!session) return state

  const sides = scoringSides(session)
  const alive = activeSides(sides, state)
  if (alive.length !== 1) return state
  if (isRoundClosed(state)) return state

  const winnerSideId = alive[0].id
  const partidaNumber = currentPartidaNumber(state)
  const next: CoupState = {
    ...state,
    partidas: [
      ...state.partidas,
      {
        id: createId(),
        winnerSideId,
        outs: [...state.eliminatedSideIds],
      },
    ],
    events: [
      ...state.events,
      {
        id: createId(),
        kind: 'win',
        sideId: winnerSideId,
        partidaNumber,
      },
    ],
  }
  syncSessionStatus(next)
  return next
}

function nextStarter(playerIds: string[], currentId: string) {
  if (playerIds.length === 0) return currentId
  const idx = playerIds.indexOf(currentId)
  return playerIds[(idx + 1) % playerIds.length] ?? playerIds[0]
}

function alivePlayerIds(sessionPlayers: Player[], sides: Team[], state: CoupState) {
  const aliveSideIds = new Set(activeSides(sides, state).map((side) => side.id))
  return sessionPlayers
    .filter((player) => {
      const sideId = sides.find((side) => side.playerIds.includes(player.id))?.id
      return sideId ? aliveSideIds.has(sideId) : false
    })
    .map((player) => player.id)
}

export const useCoupStore = create<CoupStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: (sessionId, players, _teams) => {
        const state: CoupState = {
          sessionId,
          starterPlayerId: players[0]?.id ?? '',
          targetPartidas: COUP_DEFAULT_TARGET,
          eliminatedSideIds: [],
          partidas: [],
          events: [],
        }
        const parsed = CoupStateSchema.parse(state)
        set((current) => ({
          sessions: { ...current.sessions, [sessionId]: parsed },
        }))
        return parsed
      },
      markOut: (sessionId, sideId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session || session.status === 'finished') return
        if (isRoundClosed(current)) return
        if (current.eliminatedSideIds.includes(sideId)) return

        const sides = scoringSides(session)
        const remaining = activeSides(sides, current).filter((side) => side.id !== sideId)
        if (remaining.length < 1) return

        let next: CoupState = {
          ...current,
          eliminatedSideIds: [...current.eliminatedSideIds, sideId],
          events: [
            ...current.events,
            {
              id: createId(),
              kind: 'out',
              sideId,
              partidaNumber: currentPartidaNumber(current),
            },
          ],
        }

        const starterSide = playerSideId(session, next.starterPlayerId)
        if (starterSide && next.eliminatedSideIds.includes(starterSide)) {
          const alive = alivePlayerIds(session.players, sides, next)
          next = { ...next, starterPlayerId: alive[0] ?? next.starterPlayerId }
        }

        next = maybeCloseRound(next)
        set({ sessions: { ...get().sessions, [sessionId]: next } })
      },
      undoOut: (sessionId, sideId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session || session.status === 'finished') return
        if (isRoundClosed(current)) return
        if (!current.eliminatedSideIds.includes(sideId)) return

        const outIndex = [...current.events]
          .reverse()
          .findIndex((event) => event.kind === 'out' && event.sideId === sideId)
        if (outIndex < 0) return
        const absolute = current.events.length - 1 - outIndex
        const next: CoupState = {
          ...current,
          eliminatedSideIds: current.eliminatedSideIds.filter((id) => id !== sideId),
          events: current.events.filter((_, index) => index !== absolute),
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
      },
      startNextPartida: (sessionId) => {
        const current = get().sessions[sessionId]
        const session = useSessionStore.getState().sessions[sessionId]
        if (!current || !session) return
        if (session.status === 'finished' && reachedTarget(current)) return

        const ids = session.players.map((p) => p.id)
        const partidaNumber = currentPartidaNumber(current)
        const closed = isRoundClosed(current)

        const events = closed
          ? current.events
          : current.events.filter(
              (event) => !(event.kind === 'out' && event.partidaNumber === partidaNumber),
            )

        const next: CoupState = {
          ...current,
          events,
          eliminatedSideIds: [],
          starterPlayerId: nextStarter(ids, current.starterPlayerId),
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      setTargetPartidas: (sessionId, targetPartidas) => {
        const current = get().sessions[sessionId]
        if (!current || targetPartidas < 1) return
        const next = { ...current, targetPartidas }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
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
            eliminatedSideIds: undone?.outs ?? [],
          }
          set({ sessions: { ...get().sessions, [sessionId]: next } })
          syncSessionStatus(next)
          return
        }

        const next: CoupState = {
          ...current,
          events,
          eliminatedSideIds: current.eliminatedSideIds.filter((id) => id !== last.sideId),
        }
        set({ sessions: { ...get().sessions, [sessionId]: next } })
        syncSessionStatus(next)
      },
      deleteSession: (sessionId) => {
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    {
      name: 'pontos-coup',
      version: 4,
      migrate: (persisted) => {
        const data = persisted as { sessions?: Record<string, Record<string, unknown>> }
        const sessions: Record<string, CoupState> = {}
        for (const [id, raw] of Object.entries(data.sessions ?? {})) {
          const legacyEvents = Array.isArray(raw.events) ? raw.events : []
          const legacyPartidas = Array.isArray(raw.partidas) ? raw.partidas : []
          const legacyOuts = Array.isArray(raw.eliminatedSideIds)
            ? raw.eliminatedSideIds
            : Array.isArray(raw.eliminatedPlayerIds)
              ? raw.eliminatedPlayerIds
              : []

          const parsed = CoupStateSchema.safeParse({
            sessionId: raw.sessionId ?? id,
            starterPlayerId: raw.starterPlayerId ?? '',
            targetPartidas:
              typeof raw.targetPartidas === 'number' ? raw.targetPartidas : COUP_DEFAULT_TARGET,
            eliminatedSideIds: legacyOuts,
            partidas: legacyPartidas.map((partida) => {
              const row = partida as Record<string, unknown>
              return {
                id: row.id,
                winnerSideId: row.winnerSideId ?? row.winnerPlayerId,
                outs: row.outs ?? [],
              }
            }),
            events: legacyEvents.map((event) => {
              const row = event as Record<string, unknown>
              return {
                id: row.id,
                kind: row.kind,
                sideId: row.sideId ?? row.playerId,
                partidaNumber: row.partidaNumber,
              }
            }),
          })
          if (parsed.success) sessions[id] = parsed.data
        }
        return { sessions }
      },
    },
  ),
)
