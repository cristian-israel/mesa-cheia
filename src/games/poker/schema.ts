import { z } from 'zod'

export const PokerHandSchema = z.object({
  id: z.string(),
  winnerPlayerId: z.string(),
})

/** Eliminação: sai um a um. Rodadas: só marca quem levou; vencedor e zerou são manuais. */
export const PokerWinModeSchema = z.enum(['last-standing', 'rounds'])

export const PokerStateSchema = z.object({
  sessionId: z.string(),
  dealerPlayerId: z.string(),
  winMode: PokerWinModeSchema,
  hands: z.array(PokerHandSchema),
  eliminatedPlayerIds: z.array(z.string()),
  zeroedPlayerIds: z.array(z.string()),
  sessionWinnerId: z.string().optional(),
})

export type PokerHand = z.infer<typeof PokerHandSchema>
export type PokerWinMode = z.infer<typeof PokerWinModeSchema>
export type PokerState = z.infer<typeof PokerStateSchema>

export const POKER_WIN_MODES: Array<{
  id: PokerWinMode
  label: string
  hint: string
}> = [
  {
    id: 'last-standing',
    label: 'Sair um a um',
    hint: 'Marca quem quebrou. Ganha quem sobrar na mesa.',
  },
  {
    id: 'rounds',
    label: 'Rodadas',
    hint: 'Só anota quem levou cada mão. No fim, quem venceu e quem zerou.',
  },
]

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

export function isZeroed(state: PokerState, playerId: string) {
  return state.zeroedPlayerIds.includes(playerId)
}

export function activePlayerIds(playerIds: string[], state: PokerState) {
  if (state.winMode !== 'last-standing') return playerIds
  return playerIds.filter((id) => !isEliminated(state, id))
}
