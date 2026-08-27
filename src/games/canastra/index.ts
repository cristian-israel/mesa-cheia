import { Layers } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { CanastraScreen } from '@/games/canastra/GameScreen'
import { CanastraStateSchema } from '@/games/canastra/schema'
import { useCanastraStore } from '@/games/canastra/store'
import { summarizeCanastra } from '@/games/canastra/summary'

registerGame({
  id: 'canastra',
  label: 'Canastra',
  icon: Layers,
  minPlayers: 2,
  maxPlayers: 8,
  supportsTeams: true,
  schema: CanastraStateSchema,
  createInitialState: (sessionId, players, teams) =>
    useCanastraStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => useCanastraStore.getState().deleteSession(sessionId),
  summarizeSession: summarizeCanastra,
  ScreenComponent: CanastraScreen,
})
