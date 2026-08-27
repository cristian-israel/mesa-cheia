import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/ids'
import { getGame } from '@/lib/game-registry'
import type { Player, Session, Team } from '@/schemas/session'

type SessionState = {
  sessions: Record<string, Session>
  createSession: (input: {
    gameId: string
    players: Player[]
    teams?: Team[]
  }) => Session
  finishSession: (sessionId: string) => void
  reopenSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: ({ gameId, players, teams }) => {
        const session: Session = {
          id: createId(),
          gameId,
          players,
          teams,
          createdAt: Date.now(),
          status: 'active',
        }
        set((state) => ({
          sessions: { ...state.sessions, [session.id]: session },
        }))
        return session
      },
      finishSession: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        set({
          sessions: {
            ...get().sessions,
            [sessionId]: {
              ...current,
              status: 'finished',
              finishedAt: current.finishedAt ?? Date.now(),
            },
          },
        })
      },
      reopenSession: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        set({
          sessions: {
            ...get().sessions,
            [sessionId]: { ...current, status: 'active', finishedAt: undefined },
          },
        })
      },
      deleteSession: (sessionId) => {
        const current = get().sessions[sessionId]
        if (!current) return
        getGame(current.gameId)?.deleteSession?.(sessionId)
        const next = { ...get().sessions }
        delete next[sessionId]
        set({ sessions: next })
      },
    }),
    {
      name: 'pontos-sessions',
      version: 2,
      migrate: (persisted) => persisted as { sessions: Record<string, Session> },
    },
  ),
)

export function listSessions(sessions: Record<string, Session>): Session[] {
  return Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt)
}
