import { z } from 'zod'

export const CanastraRoundSchema = z.object({
  id: z.string(),
  teamScores: z.record(z.string(), z.number()),
  winnerTeamId: z.string().optional(),
})

export const CanastraStateSchema = z.object({
  sessionId: z.string(),
  targetScore: z.number().int().min(1),
  buracoEnabled: z.boolean().default(true),
  buracoScore: z.number().int().min(1),
  dealerPlayerId: z.string(),
  rounds: z.array(CanastraRoundSchema),
})

export type CanastraRound = z.infer<typeof CanastraRoundSchema>
export type CanastraState = z.infer<typeof CanastraStateSchema>

export const CANASTRA_DEFAULT_TARGET = 3000

export function defaultBuracoScore(targetScore: number) {
  return Math.max(1, Math.floor(targetScore / 2))
}

export function buracoThreshold(state: CanastraState) {
  return state.buracoScore ?? defaultBuracoScore(state.targetScore)
}

export function isNoBuraco(state: CanastraState, total: number) {
  return (state.buracoEnabled ?? true) && total >= buracoThreshold(state)
}

export function teamTotals(state: CanastraState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const round of state.rounds) {
    for (const [teamId, points] of Object.entries(round.teamScores)) {
      totals[teamId] = (totals[teamId] ?? 0) + points
    }
  }
  return totals
}
