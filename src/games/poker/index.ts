import { Club } from 'lucide-react'
import { registerGame } from '@/lib/game-registry'
import { PokerScreen } from '@/games/poker/GameScreen'
import { PokerStateSchema } from '@/games/poker/schema'
import { usePokerStore } from '@/games/poker/store'
import { summarizePoker } from '@/games/poker/summary'

registerGame({
  id: 'poker',
  label: 'Poker',
  icon: Club,
  minPlayers: 2,
  maxPlayers: 10,
  supportsTeams: false,
  schema: PokerStateSchema,
  createInitialState: (sessionId, players, teams) =>
    usePokerStore.getState().createSession(sessionId, players, teams),
  deleteSession: (sessionId) => usePokerStore.getState().deleteSession(sessionId),
  summarizeSession: summarizePoker,
  ScreenComponent: PokerScreen,
})
