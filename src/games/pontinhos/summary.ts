import type { SessionSummary } from '@/lib/game-registry'
import type { Session } from '@/schemas/session'
import { scoreLeaders, playerTotals } from '@/games/pontinhos/schema'
import { usePontinhosStore } from '@/games/pontinhos/store'

export function summarizePontinhos(session: Session): SessionSummary {
  const state = usePontinhosStore.getState().sessions[session.id]
  const totals = state ? playerTotals(state) : {}
  const playerIds = session.players.map((player) => player.id)
  const leaders = state ? scoreLeaders(state, playerIds) : new Set<string>()

  return {
    mode: 'individual',
    modeLabel: 'Individual',
    sides: session.players.map((player) => ({
      id: player.id,
      name: player.name,
      members: [player.name],
      score: totals[player.id] ?? 0,
      leader: leaders.has(player.id),
    })),
  }
}
