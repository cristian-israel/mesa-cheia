import { z } from 'zod'

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
})

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  playerIds: z.array(z.string()),
})

export const SessionSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  players: z.array(PlayerSchema),
  teams: z.array(TeamSchema).optional(),
  createdAt: z.number(),
  finishedAt: z.number().optional(),
  status: z.enum(['active', 'finished']),
})

export type Player = z.infer<typeof PlayerSchema>
export type Team = z.infer<typeof TeamSchema>
export type Session = z.infer<typeof SessionSchema>
