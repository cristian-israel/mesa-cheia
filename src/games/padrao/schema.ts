import { z } from 'zod'

export const PadraoEventSchema = z.object({
  id: z.string(),
  sideId: z.string(),
  label: z.string(),
  delta: z.number().int(),
})

export const PadraoStateSchema = z.object({
  sessionId: z.string(),
  targetScore: z.number().int().min(1),
  dealerPlayerId: z.string(),
  events: z.array(PadraoEventSchema),
})

export type PadraoEvent = z.infer<typeof PadraoEventSchema>
export type PadraoState = z.infer<typeof PadraoStateSchema>

export const PADRAO_DEFAULT_TARGET = 100
export const PADRAO_TARGETS = [10, 50, 100, 500] as const

export function sideTotals(state: PadraoState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const event of state.events) {
    totals[event.sideId] = (totals[event.sideId] ?? 0) + event.delta
  }
  return totals
}
