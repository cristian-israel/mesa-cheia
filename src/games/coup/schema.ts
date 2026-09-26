import { z } from 'zod'

export const CoupPartidaSchema = z.object({
  id: z.string(),
  winnerPlayerId: z.string(),
})

export const CoupWinModeSchema = z.enum(['last-standing', 'target'])

export const CoupStateSchema = z.object({
  sessionId: z.string(),
  dealerPlayerId: z.string(),
  winMode: CoupWinModeSchema,
  targetPartidas: z.number().int().min(1),
  partidas: z.array(CoupPartidaSchema),
  eliminatedPlayerIds: z.array(z.string()),
})

export type CoupPartida = z.infer<typeof CoupPartidaSchema>
export type CoupWinMode = z.infer<typeof CoupWinModeSchema>
export type CoupState = z.infer<typeof CoupStateSchema>

export const COUP_DEFAULT_TARGET = 3

export function partidasWon(state: CoupState): Record<string, number> {
  const won: Record<string, number> = {}
  for (const partida of state.partidas) {
    won[partida.winnerPlayerId] = (won[partida.winnerPlayerId] ?? 0) + 1
  }
  return won
}

export function isEliminated(state: CoupState, playerId: string) {
  return state.eliminatedPlayerIds.includes(playerId)
}

export function activePlayerIds(playerIds: string[], state: CoupState) {
  if (state.winMode !== 'last-standing') return playerIds
  return playerIds.filter((id) => !isEliminated(state, id))
}
