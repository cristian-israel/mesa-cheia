import type { SessionSummary } from '@/lib/game-registry'
import type { Session } from '@/schemas/session'
import { partidasWon } from '@/games/coup/schema'
import { useCoupStore } from '@/games/coup/store'

export function summarizeCoup(session: Session): SessionSummary {
  const state = useCoupStore.getState().sessions[session.id]
  const won = state ? partidasWon(state) : {}
  const scores = session.players.map((player) => won[player.id] ?? 0)
  const max = Math.max(0, ...scores)
  const allTied = scores.length > 1 && scores.every((score) => score === max)

  const leaderIds =
    max > 0 && !allTied
      ? new Set(
          session.players
            .filter((player) => (won[player.id] ?? 0) === max)
            .map((player) => player.id),
        )
      : new Set<string>()

  return {
    mode: 'individual',
    modeLabel: 'Individual',
    sides: session.players.map((player) => ({
      id: player.id,
      name: player.name,
      members: [player.name],
      score: won[player.id] ?? 0,
      leader: leaderIds.has(player.id),
    })),
  }
}
