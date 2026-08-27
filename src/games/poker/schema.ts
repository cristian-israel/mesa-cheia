import { z } from 'zod'

export const PokerHandSchema = z.object({
  id: z.string(),
  winnerPlayerId: z.string(),
})

export const PokerWinModeSchema = z.enum(['last-standing', 'target'])

export const PokerStateSchema = z.object({
  sessionId: z.string(),
  dealerPlayerId: z.string(),
  winMode: PokerWinModeSchema,
  targetMesas: z.number().int().min(1),
  hands: z.array(PokerHandSchema),
  eliminatedPlayerIds: z.array(z.string()),
})

export type PokerHand = z.infer<typeof PokerHandSchema>
export type PokerWinMode = z.infer<typeof PokerWinModeSchema>
export type PokerState = z.infer<typeof PokerStateSchema>

export const POKER_DEFAULT_TARGET = 5

export function mesasWon(state: PokerState): Record<string, number> {
  const won: Record<string, number> = {}
  for (const hand of state.hands) {
    won[hand.winnerPlayerId] = (won[hand.winnerPlayerId] ?? 0) + 1
  }
  return won
}

export function isEliminated(state: PokerState, playerId: string) {
  return state.eliminatedPlayerIds.includes(playerId)
}

export function activePlayerIds(playerIds: string[], state: PokerState) {
  if (state.winMode !== 'last-standing') return playerIds
  return playerIds.filter((id) => !isEliminated(state, id))
}
