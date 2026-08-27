import { Swords } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { TrucoScreen } from '@/games/truco/GameScreen'
import { TrucoStateSchema } from '@/games/truco/schema'
import { useTrucoStore } from '@/games/truco/store'
import { summarizeTruco } from '@/games/truco/summary'

registerGame({
  id: 'truco',
  label: 'Truco gaúcho',
  icon: Swords,
  supportsTeams: true,
  schema: TrucoStateSchema,
  createInitialState: (sessionId, players, teams) =>
    useTrucoStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => useTrucoStore.getState().deleteSession(sessionId),
  summarizeSession: summarizeTruco,
  ScreenComponent: TrucoScreen,
})
