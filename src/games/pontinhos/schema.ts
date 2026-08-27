import { z } from 'zod'

export const PontinhosRoundSchema = z.object({
  id: z.string(),
  scores: z.record(z.string(), z.number()),
  winnerPlayerId: z.string().optional(),
})

export const PontinhosStateSchema = z.object({
  sessionId: z.string(),
  targetScore: z.number().int().min(1),
  dealerPlayerId: z.string(),
  rounds: z.array(PontinhosRoundSchema),
})

export type PontinhosRound = z.infer<typeof PontinhosRoundSchema>
export type PontinhosState = z.infer<typeof PontinhosStateSchema>

export const PONTINHOS_DEFAULT_TARGET = 100
export const PONTINHOS_TARGETS = [50, 100, 200] as const

export function playerTotals(state: PontinhosState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const round of state.rounds) {
    for (const [playerId, points] of Object.entries(round.scores)) {
      totals[playerId] = (totals[playerId] ?? 0) + points
    }
  }
  return totals
}

export function roundLeaders(scores: Record<string, number>, playerIds: string[]) {
  const values = playerIds.map((id) => scores[id] ?? 0)
  const max = Math.max(...values)
  if (values.every((score) => score === max)) return new Set<string>()
  return new Set(playerIds.filter((id) => (scores[id] ?? 0) === max))
}
