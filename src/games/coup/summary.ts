import type { SessionSummary } from '@/lib/game-registry'
import type { Session } from '@/schemas/session'
import { activePlayerIds, partidasWon } from '@/games/coup/schema'
import { useCoupStore } from '@/games/coup/store'

export function summarizeCoup(session: Session): SessionSummary {
  const state = useCoupStore.getState().sessions[session.id]
  const won = state ? partidasWon(state) : {}
  const scores = session.players.map((player) => won[player.id] ?? 0)
  const max = Math.max(0, ...scores)
  const allTied = scores.length > 1 && scores.every((score) => score === max)

  let leaderIds = new Set<string>()
  if (state?.winMode === 'last-standing' && session.status === 'finished') {
    const alive = activePlayerIds(
      session.players.map((p) => p.id),
      state,
    )
    leaderIds = new Set(alive)
  } else if (max > 0 && !allTied) {
    leaderIds = new Set(
      session.players.filter((player) => (won[player.id] ?? 0) === max).map((player) => player.id),
    )
  }

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
