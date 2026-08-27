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

export function registerGame(def: GameDefinition) {
  gameRegistry.set(def.id, def)
}

export function listGames(): GameDefinition[] {
  return [...gameRegistry.values()]
}

export function getGame(id: string): GameDefinition | undefined {
  return gameRegistry.get(id)
}
