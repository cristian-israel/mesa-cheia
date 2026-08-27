import { Diamond } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { PontinhosScreen } from '@/games/pontinhos/GameScreen'
import { PontinhosStateSchema } from '@/games/pontinhos/schema'
import { usePontinhosStore } from '@/games/pontinhos/store'
import { summarizePontinhos } from '@/games/pontinhos/summary'

registerGame({
  id: 'pontinhos',
  label: 'Pontinhos',
  icon: Diamond,
  supportsTeams: false,
  schema: PontinhosStateSchema,
  createInitialState: (sessionId, players, teams) =>
    usePontinhosStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => usePontinhosStore.getState().deleteSession(sessionId),
  summarizeSession: summarizePontinhos,
  ScreenComponent: PontinhosScreen,
})
