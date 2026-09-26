import { z } from 'zod'
import type { Session, Team } from '@/schemas/session'
import { scoringSides } from '@/lib/teams'

export const CoupEventSchema = z.object({
  id: z.string(),
  kind: z.enum(['out', 'win']),
  sideId: z.string(),
  partidaNumber: z.number().int().min(1),
})

export const CoupPartidaSchema = z.object({
  id: z.string(),
  winnerSideId: z.string(),
  outs: z.array(z.string()),
})

export const CoupStateSchema = z.object({
  sessionId: z.string(),
  starterPlayerId: z.string(),
  targetPartidas: z.number().int().min(1),
  eliminatedSideIds: z.array(z.string()),
  partidas: z.array(CoupPartidaSchema),
  events: z.array(CoupEventSchema),
})

export type CoupEvent = z.infer<typeof CoupEventSchema>
export type CoupPartida = z.infer<typeof CoupPartidaSchema>
export type CoupState = z.infer<typeof CoupStateSchema>

export const COUP_DEFAULT_TARGET = 5

export function partidasWon(state: CoupState): Record<string, number> {
  const won: Record<string, number> = {}
  for (const partida of state.partidas) {
    won[partida.winnerSideId] = (won[partida.winnerSideId] ?? 0) + 1
  }
  return won
}

export function isEliminated(state: CoupState, sideId: string) {
  return state.eliminatedSideIds.includes(sideId)
}

export function activeSides(sides: Team[], state: CoupState) {
  return sides.filter((side) => !isEliminated(state, side.id))
}

export function currentPartidaNumber(state: CoupState) {
  return state.partidas.length + 1
}

/** Rodada fechada: já tem vencedor e o placar ainda mostra quem saiu. */
export function isRoundClosed(state: CoupState) {
  const last = state.events.at(-1)
  return last?.kind === 'win' && state.eliminatedSideIds.length > 0
}

export function reachedTarget(state: CoupState) {
  return Object.values(partidasWon(state)).some((count) => count >= state.targetPartidas)
}

export function sideLabel(session: Session, sideId: string) {
  const side = scoringSides(session).find((item) => item.id === sideId)
  return side?.name ?? '—'
}

export function playerSideId(session: Session, playerId: string) {
  return scoringSides(session).find((side) => side.playerIds.includes(playerId))?.id
}
