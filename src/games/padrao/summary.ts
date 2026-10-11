import type { SessionSummary } from '@/lib/game-registry'
import { groupSizeLabel, scoringSides } from '@/lib/teams'
import type { Session } from '@/schemas/session'
import { scoreLeaders, sideTotals } from '@/games/padrao/schema'
import { usePadraoStore } from '@/games/padrao/store'

export function summarizePadrao(session: Session): SessionSummary {
  const grouped = Boolean(session.teams && session.teams.length > 0)
  const sides = scoringSides(session)
  const state = usePadraoStore.getState().sessions[session.id]
  const totals = state ? sideTotals(state) : {}
  const leaders = state
    ? scoreLeaders(
        state,
        sides.map((side) => side.id),
      )
    : new Set<string>()
  const teamSize = session.teams?.[0]?.playerIds.length ?? 1

  return {
    mode: grouped ? 'groups' : 'individual',
    modeLabel: grouped ? groupSizeLabel(teamSize) : 'Individual',
    sides: sides.map((side) => ({
      id: side.id,
      name: side.name,
      members: side.playerIds
        .map((id) => session.players.find((player) => player.id === id)?.name ?? '')
        .filter(Boolean),
      score: totals[side.id],
      leader: leaders.has(side.id),
    })),
  }
}
