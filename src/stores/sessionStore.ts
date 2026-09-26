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
    title?: string
  }) => Session
  setSessionTitle: (sessionId: string, title: string) => void
  finishSession: (sessionId: string) => void
  reopenSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

function normalizeTitle(title?: string) {
  const trimmed = title?.trim()
  return trimmed ? trimmed : undefined
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession: ({ gameId, players, teams, title }) => {
        const session: Session = {
          id: createId(),
          gameId,
          title: normalizeTitle(title),
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
      setSessionTitle: (sessionId, title) => {
        const current = get().sessions[sessionId]
        if (!current) return
        const nextTitle = normalizeTitle(title)
        if (current.title === nextTitle) return
        set({
          sessions: {
            ...get().sessions,
            [sessionId]: { ...current, title: nextTitle },
          },
        })
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
      version: 3,
      migrate: (persisted) => persisted as { sessions: Record<string, Session> },
    },
  ),
)

export function listSessions(sessions: Record<string, Session>): Session[] {
  return Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt)
}
