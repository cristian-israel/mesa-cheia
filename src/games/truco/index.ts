import { Swords } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { TrucoScreen } from '@/games/truco/GameScreen'
import { TrucoStateSchema } from '@/games/truco/schema'
import { useTrucoStore } from '@/games/truco/store'
import { summarizeTruco } from '@/games/truco/summary'
import ordem from '@/games/truco/assets/ordem.jpg'
import guide from '@/games/truco/guide.md?raw'

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
  guide: {
    markdown: guide,
    attachments: [{ id: 'ordem', label: 'Ordem das cartas', src: ordem }],
  },
})
