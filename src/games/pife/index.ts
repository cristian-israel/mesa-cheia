import { Grid3x3 } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { PifeScreen } from '@/games/pife/GameScreen'
import { PifeStateSchema } from '@/games/pife/schema'
import { usePifeStore } from '@/games/pife/store'
import { summarizePife } from '@/games/pife/summary'

registerGame({
  id: 'pife',
  label: 'Pife',
  icon: Grid3x3,
  minPlayers: 2,
  maxPlayers: 6,
  supportsTeams: false,
  schema: PifeStateSchema,
  createInitialState: (sessionId, players, teams) =>
    usePifeStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => usePifeStore.getState().deleteSession(sessionId),
  summarizeSession: summarizePife,
  ScreenComponent: PifeScreen,
})
