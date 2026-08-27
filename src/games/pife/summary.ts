import type { SessionSummary } from '@/lib/game-registry'
import type { Session } from '@/schemas/session'
import { pifesWon } from '@/games/pife/schema'
import { usePifeStore } from '@/games/pife/store'

export function summarizePife(session: Session): SessionSummary {
  const state = usePifeStore.getState().sessions[session.id]
  const won = state ? pifesWon(state) : {}
  const scores = session.players.map((player) => won[player.id] ?? 0)
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
      score: won[player.id] ?? 0,
      leader: hasLeader && (won[player.id] ?? 0) === max,
    })),
  }
}
