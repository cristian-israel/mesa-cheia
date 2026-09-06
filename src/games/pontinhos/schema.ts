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

/** Em Pontinhos, menos pontos é melhor — na mão e no placar. */
export function roundLeaders(scores: Record<string, number>, playerIds: string[]) {
  const values = playerIds.map((id) => scores[id] ?? 0)
  const min = Math.min(...values)
  if (values.every((score) => score === min)) return new Set<string>()
  return new Set(playerIds.filter((id) => (scores[id] ?? 0) === min))
}

export function isBusted(total: number, targetScore: number) {
  return total >= targetScore
}

/** Quem ainda não estourou o alvo; se todos estourou, a lista fica vazia. */
export function activePlayerIds(state: PontinhosState, playerIds: string[]) {
  const totals = playerTotals(state)
  return playerIds.filter((id) => !isBusted(totals[id] ?? 0, state.targetScore))
}

/**
 * Líderes = menor pontuação entre quem ainda não atingiu o alvo.
 * Empate entre os elegíveis → ninguém destacado.
 */
export function scoreLeaders(state: PontinhosState, playerIds: string[]) {
  const totals = playerTotals(state)
  const eligible = activePlayerIds(state, playerIds)
  if (eligible.length === 0) return new Set<string>()
  const values = eligible.map((id) => totals[id] ?? 0)
  const min = Math.min(...values)
  const allTied = eligible.length > 1 && values.every((score) => score === min)
  if (allTied) return new Set<string>()
  return new Set(eligible.filter((id) => (totals[id] ?? 0) === min))
}
