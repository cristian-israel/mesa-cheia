import { Club } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { PokerScreen } from '@/games/poker/GameScreen'
import { PokerStateSchema } from '@/games/poker/schema'
import { usePokerStore } from '@/games/poker/store'
import { summarizePoker } from '@/games/poker/summary'
import maos from '@/games/poker/assets/maos.webp'
import guide from '@/games/poker/guide.md?raw'

registerGame({
  id: 'poker',
  label: 'Poker',
  icon: Club,
  supportsTeams: false,
  schema: PokerStateSchema,
  createInitialState: (sessionId, players, teams) =>
    usePokerStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => usePokerStore.getState().deleteSession(sessionId),
  summarizeSession: summarizePoker,
  ScreenComponent: PokerScreen,
  guide: {
    markdown: guide,
    attachments: [{ id: 'maos', label: 'Ranking das mãos', src: maos }],
  },
})
