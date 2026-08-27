import type { SessionSummary } from '@/lib/game-registry'
import { groupSizeLabel, scoringSides } from '@/lib/teams'
import type { Session } from '@/schemas/session'
import { teamTotals } from '@/games/canastra/schema'
import { useCanastraStore } from '@/games/canastra/store'

export function summarizeCanastra(session: Session): SessionSummary {
  const grouped = Boolean(session.teams && session.teams.length > 0)
  const sides = scoringSides(session)
  const state = useCanastraStore.getState().sessions[session.id]
  const totals = state ? teamTotals(state) : {}
  const scores = sides.map((side) => totals[side.id] ?? 0)
  const max = Math.max(0, ...scores)
  const allTied = scores.length > 1 && scores.every((score) => score === max)
  const hasLeader = max > 0 && !allTied
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
      leader: hasLeader && (totals[side.id] ?? 0) === max,
    })),
  }
}
