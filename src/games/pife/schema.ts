import { z } from 'zod'

export const PifeRoundSchema = z.object({
  id: z.string(),
  winnerPlayerId: z.string(),
})

export const PifeStateSchema = z.object({
  sessionId: z.string(),
  targetScore: z.number().int().min(1),
  dealerPlayerId: z.string(),
  rounds: z.array(PifeRoundSchema),
})

export type PifeRound = z.infer<typeof PifeRoundSchema>
export type PifeState = z.infer<typeof PifeStateSchema>

export const PIFE_DEFAULT_TARGET = 10
export const PIFE_TARGETS = [5, 7, 10] as const

export function pifesWon(state: PifeState): Record<string, number> {
  const won: Record<string, number> = {}
  for (const round of state.rounds) {
    won[round.winnerPlayerId] = (won[round.winnerPlayerId] ?? 0) + 1
  }
  return won
}
