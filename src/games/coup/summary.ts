import type { SessionSummary } from '@/lib/game-registry'
import { groupSizeLabel, scoringSides } from '@/lib/teams'
import type { Session } from '@/schemas/session'
import { partidasWon } from '@/games/coup/schema'
import { useCoupStore } from '@/games/coup/store'

export function summarizeCoup(session: Session): SessionSummary {
  const grouped = Boolean(session.teams && session.teams.length > 0)
  const sides = scoringSides(session)
  const state = useCoupStore.getState().sessions[session.id]
  const won = state ? partidasWon(state) : {}
  const scores = sides.map((side) => won[side.id] ?? 0)
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
      score: won[side.id] ?? 0,
      leader: hasLeader && (won[side.id] ?? 0) === max,
    })),
  }
}
