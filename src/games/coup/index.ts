import { Crown } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { CoupScreen } from '@/games/coup/GameScreen'
import { CoupStateSchema } from '@/games/coup/schema'
import { useCoupStore } from '@/games/coup/store'
import { summarizeCoup } from '@/games/coup/summary'
import regras from '@/games/coup/assets/regras.jpg'
import guide from '@/games/coup/guide.md?raw'

registerGame({
  id: 'coup',
  label: 'Coup',
  icon: Crown,
  minPlayers: 2,
  maxPlayers: 6,
  supportsTeams: false,
  schema: CoupStateSchema,
  createInitialState: (sessionId, players, teams) =>
    useCoupStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => useCoupStore.getState().deleteSession(sessionId),
  summarizeSession: summarizeCoup,
  ScreenComponent: CoupScreen,
  guide: {
    markdown: guide,
    attachments: [{ id: 'regras', label: 'Quadro de regras', src: regras }],
  },
})
