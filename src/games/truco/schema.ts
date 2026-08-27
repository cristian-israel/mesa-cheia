import { z } from 'zod'

export const TrucoEventSchema = z.object({
  id: z.string(),
  sideId: z.string(),
  label: z.string(),
  delta: z.number().int(),
})

export const TrucoStateSchema = z.object({
  sessionId: z.string(),
  targetScore: z.number().int().min(1),
  dealerPlayerId: z.string(),
  events: z.array(TrucoEventSchema),
})

export type TrucoEvent = z.infer<typeof TrucoEventSchema>
export type TrucoState = z.infer<typeof TrucoStateSchema>

export const TRUCO_DEFAULT_TARGET = 24
export const TRUCO_TARGETS = [12, 24] as const

export type TrucoShortcut = {
  id: string
  label: string
  delta: number
}

export const TRUCO_SHORTCUTS: TrucoShortcut[] = [
  { id: 'mao', label: 'Mão', delta: 1 },
  { id: 'truco', label: 'Truco', delta: 2 },
  { id: 'retruco', label: 'Retruco', delta: 3 },
  { id: 'vale4', label: 'Vale 4', delta: 4 },
  { id: 'invido', label: 'Invido', delta: 2 },
  { id: 'reinvido', label: 'Reinvido', delta: 3 },
  { id: 'flor', label: 'Flor', delta: 3 },
  { id: 'contraflor', label: 'Contraflor', delta: 6 },
]

export function teamTotals(state: TrucoState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const event of state.events) {
    totals[event.sideId] = (totals[event.sideId] ?? 0) + event.delta
  }
  return totals
}

export function faltaDelta(targetScore: number, selectedScore: number) {
  return Math.max(0, targetScore - selectedScore)
}
