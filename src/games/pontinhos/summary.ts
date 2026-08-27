import type { SessionSummary } from '@/lib/game-registry'
import type { Session } from '@/schemas/session'
import { playerTotals } from '@/games/pontinhos/schema'
import { usePontinhosStore } from '@/games/pontinhos/store'

export function summarizePontinhos(session: Session): SessionSummary {
  const state = usePontinhosStore.getState().sessions[session.id]
  const totals = state ? playerTotals(state) : {}
  const scores = session.players.map((player) => totals[player.id] ?? 0)
  const max = Math.max(0, ...scores)
  const allTied = scores.length > 1 && scores.every((score) => score === max)
  const hasLeader = max > 0 && !allTied

  return {
    mode: 'individual',
    modeLabel: 'Individual',
    sides: session.players.map((player) => ({
      id: player.id,
      name: player.name,
      members: [player.name],
      score: totals[player.id] ?? 0,
      leader: hasLeader && (totals[player.id] ?? 0) === max,
    })),
  }
}
