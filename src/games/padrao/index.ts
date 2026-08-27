import { Hash } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { PadraoScreen } from '@/games/padrao/GameScreen'
import { PadraoStateSchema } from '@/games/padrao/schema'
import { usePadraoStore } from '@/games/padrao/store'
import { summarizePadrao } from '@/games/padrao/summary'

registerGame({
  id: 'padrao',
  label: 'Padrão',
  icon: Hash,
  supportsTeams: true,
  schema: PadraoStateSchema,
  createInitialState: (sessionId, players, teams) =>
    usePadraoStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => usePadraoStore.getState().deleteSession(sessionId),
  summarizeSession: summarizePadrao,
  ScreenComponent: PadraoScreen,
})
