import { z } from 'zod'

export const CoupEventSchema = z.object({
  id: z.string(),
  kind: z.enum(['out', 'win']),
  playerId: z.string(),
  partidaNumber: z.number().int().min(1),
})

export const CoupPartidaSchema = z.object({
  id: z.string(),
  winnerPlayerId: z.string(),
  outs: z.array(z.string()),
})

export const CoupStateSchema = z.object({
  sessionId: z.string(),
  starterPlayerId: z.string(),
  eliminatedPlayerIds: z.array(z.string()),
  partidas: z.array(CoupPartidaSchema),
  events: z.array(CoupEventSchema),
})

export type CoupEvent = z.infer<typeof CoupEventSchema>
export type CoupPartida = z.infer<typeof CoupPartidaSchema>
export type CoupState = z.infer<typeof CoupStateSchema>

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
  return playerIds.filter((id) => !isEliminated(state, id))
}

export function currentPartidaNumber(state: CoupState) {
  return state.partidas.length + 1
}
