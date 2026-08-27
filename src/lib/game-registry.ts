import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import type { z } from 'zod'
import type { Player, Session, Team } from '@/schemas/session'

export type SideSummary = {
  id: string
  name: string
  members: string[]
  score?: number
  leader?: boolean
}

export type SessionSummary = {
  mode: 'individual' | 'groups'
  modeLabel: string
  sides: SideSummary[]
}

export const GAME_MIN_PLAYERS = 2
export const GAME_MAX_PLAYERS = 12

export interface GameDefinition<TState = unknown> {
  id: string
  label: string
  icon: LucideIcon
  minPlayers: number
  maxPlayers: number
  supportsTeams: boolean
  teamSize?: number
  schema: z.ZodType<TState>
  createInitialState: (sessionId: string, players: Player[], teams?: Team[]) => TState
  deleteSession?: (sessionId: string) => void
  summarizeSession?: (session: Session) => SessionSummary
  ScreenComponent: ComponentType<{ sessionId: string }>
}

export const gameRegistry = new Map<string, GameDefinition>()

export function registerGame(
  def: Omit<GameDefinition, 'minPlayers' | 'maxPlayers'> & {
    minPlayers?: number
    maxPlayers?: number
  },
) {
  gameRegistry.set(def.id, {
    ...def,
    minPlayers: def.minPlayers ?? GAME_MIN_PLAYERS,
    maxPlayers: def.maxPlayers ?? GAME_MAX_PLAYERS,
  })
}

export function listGames(): GameDefinition[] {
  return [...gameRegistry.values()]
}

export function getGame(id: string): GameDefinition | undefined {
  return gameRegistry.get(id)
}
