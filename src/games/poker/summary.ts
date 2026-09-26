import type { SessionSummary } from '@/lib/game-registry'
import type { Session } from '@/schemas/session'
import { activePlayerIds, mesasWon } from '@/games/poker/schema'
import { usePokerStore } from '@/games/poker/store'

export function summarizePoker(session: Session): SessionSummary {
  const state = usePokerStore.getState().sessions[session.id]
  const won = state ? mesasWon(state) : {}
  const roundsMode = state?.winMode === 'rounds'

  let leaderIds = new Set<string>()
  if (state?.winMode === 'last-standing' && session.status === 'finished') {
    const alive = activePlayerIds(
      session.players.map((p) => p.id),
      state,
    )
    leaderIds = new Set(alive)
  } else if (roundsMode && state.sessionWinnerId) {
    leaderIds = new Set([state.sessionWinnerId])
  } else if (!roundsMode) {
    const scores = session.players.map((player) => won[player.id] ?? 0)
    const max = Math.max(0, ...scores)
    const allTied = scores.length > 1 && scores.every((score) => score === max)
    if (max > 0 && !allTied) {
      leaderIds = new Set(
        session.players.filter((player) => (won[player.id] ?? 0) === max).map((player) => player.id),
      )
    }
  }

  return {
    mode: 'individual',
    modeLabel: roundsMode ? 'Rodadas' : 'Sair um a um',
    sides: session.players.map((player) => {
      const zeroed = state?.zeroedPlayerIds.includes(player.id)
      const out = state?.eliminatedPlayerIds.includes(player.id)
      return {
        id: player.id,
        name: zeroed ? `${player.name} · zerou` : out ? `${player.name} · saiu` : player.name,
        members: [player.name],
        score: roundsMode ? undefined : won[player.id] ?? 0,
        leader: leaderIds.has(player.id),
      }
    }),
  }
}
