import { createId } from '@/lib/ids'
import type { Player, Session, Team } from '@/schemas/session'

export function groupSizeOptions(playerCount: number) {
  const sizes: number[] = []
  for (let size = 2; size <= Math.floor(playerCount / 2); size += 1) {
    if (playerCount % size === 0) sizes.push(size)
  }
  return sizes
}

export function groupSizeLabel(teamSize: number) {
  if (teamSize === 2) return 'Duplas'
  if (teamSize === 3) return 'Trios'
  return `Grupos de ${teamSize}`
}

export function groupNoun(teamSize: number, count = 2) {
  if (teamSize === 2) return count === 1 ? 'dupla' : 'duplas'
  if (teamSize === 3) return count === 1 ? 'trio' : 'trios'
  return count === 1 ? 'grupo' : 'grupos'
}

export function defaultGroupName(index: number, teamSize: number, teamCount: number) {
  if (teamSize === 2 && teamCount === 2) return index === 0 ? 'Nós' : 'Eles'
  if (teamSize === 2) return `Dupla ${index + 1}`
  if (teamSize === 3) return `Trio ${index + 1}`
  return `Grupo ${index + 1}`
}

export function createEmptyTeams(playerCount: number, teamSize: number): Team[] {
  const teamCount = playerCount / teamSize
  return Array.from({ length: teamCount }, (_, index) => ({
    id: createId(),
    name: defaultGroupName(index, teamSize, teamCount),
    playerIds: [],
  }))
}

export function teamsAreComplete(teams: Team[], players: Player[], teamSize: number) {
  const assigned = new Set(teams.flatMap((t) => t.playerIds))
  return (
    teams.length === Math.floor(players.length / teamSize) &&
    teams.every((t) => t.playerIds.length === teamSize && t.name.trim().length > 0) &&
    assigned.size === players.length
  )
}

export function alternatePlayerOrder(players: Player[], teams: Team[]): Player[] {
  const byId = new Map(players.map((player) => [player.id, player]))
  const columns = teams.map((team) =>
    team.playerIds.map((id) => byId.get(id)).filter((player): player is Player => Boolean(player)),
  )
  const ordered: Player[] = []
  const depth = Math.max(0, ...columns.map((column) => column.length))
  for (let index = 0; index < depth; index += 1) {
    for (const column of columns) {
      const player = column[index]
      if (player) ordered.push(player)
    }
  }
  for (const player of players) {
    if (!ordered.some((item) => item.id === player.id)) ordered.push(player)
  }
  return ordered
}

export function scoringSides(session: Session): Team[] {
  if (session.teams && session.teams.length > 0) return session.teams
  return session.players.map((player) => ({
    id: player.id,
    name: player.name,
    playerIds: [player.id],
  }))
}

export function teamNameForPlayer(playerId: string, teams?: Team[]) {
  return teams?.find((team) => team.playerIds.includes(playerId))?.name
}
