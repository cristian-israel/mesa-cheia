import { z } from 'zod'

export const PadraoEventSchema = z.object({
  id: z.string(),
  sideId: z.string(),
  label: z.string(),
  delta: z.number().int(),
})

/** Rodadas: +1 por vitória. Pontos: soma o que cada um fez. */
export const PadraoScoreModeSchema = z.enum(['rounds', 'points'])

/** Só no modo pontos: fechar o alvo ganha ou perde. */
export const PadraoTargetRuleSchema = z.enum(['win', 'lose'])

export const PadraoStateSchema = z.object({
  sessionId: z.string(),
  targetScore: z.number().int().min(1),
  dealerPlayerId: z.string(),
  scoreMode: PadraoScoreModeSchema,
  targetRule: PadraoTargetRuleSchema,
  events: z.array(PadraoEventSchema),
})

export type PadraoEvent = z.infer<typeof PadraoEventSchema>
export type PadraoScoreMode = z.infer<typeof PadraoScoreModeSchema>
export type PadraoTargetRule = z.infer<typeof PadraoTargetRuleSchema>
export type PadraoState = z.infer<typeof PadraoStateSchema>

export const PADRAO_DEFAULT_TARGET = 100
export const PADRAO_DEFAULT_ROUNDS_TARGET = 10
export const PADRAO_TARGETS = [10, 50, 100, 500] as const

export function sideTotals(state: PadraoState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const event of state.events) {
    totals[event.sideId] = (totals[event.sideId] ?? 0) + event.delta
  }
  return totals
}

export function isPointsMode(state: PadraoState) {
  return state.scoreMode === 'points'
}

/** No modo pontos + alvo perde, fechar é derrota (como Pontinhos). */
export function isTargetLose(state: PadraoState) {
  return isPointsMode(state) && state.targetRule === 'lose'
}

export function isClosed(total: number, state: PadraoState) {
  return total >= state.targetScore
}

export function activeSideIds(state: PadraoState, sideIds: string[]) {
  const totals = sideTotals(state)
  return sideIds.filter((id) => !isClosed(totals[id] ?? 0, state))
}

/**
 * Líderes no placar.
 * Alvo ganha / rodadas: maior pontuação.
 * Alvo perde: menor pontuação entre quem ainda não fechou.
 */
export function scoreLeaders(state: PadraoState, sideIds: string[]) {
  const totals = sideTotals(state)
  if (isTargetLose(state)) {
    const eligible = activeSideIds(state, sideIds)
    if (eligible.length === 0) return new Set<string>()
    const values = eligible.map((id) => totals[id] ?? 0)
    const min = Math.min(...values)
    if (eligible.length > 1 && values.every((score) => score === min)) return new Set<string>()
    return new Set(eligible.filter((id) => (totals[id] ?? 0) === min))
  }

  const values = sideIds.map((id) => totals[id] ?? 0)
  const max = Math.max(0, ...values)
  if (max <= 0) return new Set<string>()
  if (sideIds.length > 1 && values.every((score) => score === max)) return new Set<string>()
  return new Set(sideIds.filter((id) => (totals[id] ?? 0) === max))
}

export function hasReachedTarget(state: PadraoState) {
  return Object.values(sideTotals(state)).some((score) => score >= state.targetScore)
}
