import { getGame, type SessionSummary } from '@/lib/game-registry'
import { scoringSides } from '@/lib/teams'
import type { Session } from '@/schemas/session'

export type RankCounts = {
  played: number
  wins: number
  winsIndividual: number
  winsGroup: number
}

export type PlayerRank = RankCounts & {
  key: string
  name: string
  byGame: Record<string, RankCounts>
}

export type GameRank = {
  gameId: string
  played: number
  players: PlayerRank[]
}

function fallbackSummary(session: Session): SessionSummary {
  const grouped = Boolean(session.teams && session.teams.length > 0)
  const sides = scoringSides(session)
  return {
    mode: grouped ? 'groups' : 'individual',
    modeLabel: grouped ? 'Grupos' : 'Individual',
    sides: sides.map((side) => ({
      id: side.id,
      name: side.name,
      members: side.playerIds
        .map((id) => session.players.find((player) => player.id === id)?.name ?? '')
        .filter(Boolean),
    })),
  }
}

export function sessionSummary(session: Session): SessionSummary {
  return getGame(session.gameId)?.summarizeSession?.(session) ?? fallbackSummary(session)
}

export function rankingKey(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

function emptyCounts(): RankCounts {
  return { played: 0, wins: 0, winsIndividual: 0, winsGroup: 0 }
}

function bump(counts: RankCounts, field: keyof RankCounts, amount = 1) {
  counts[field] += amount
}

function ensurePlayer(map: Map<string, PlayerRank>, name: string) {
  const key = rankingKey(name)
  const current = map.get(key)
  if (current) {
    current.name = name
    return current
  }
  const created: PlayerRank = { key, name, ...emptyCounts(), byGame: {} }
  map.set(key, created)
  return created
}

function ensureGame(player: PlayerRank, gameId: string) {
  const current = player.byGame[gameId]
  if (current) return current
  const created = emptyCounts()
  player.byGame[gameId] = created
  return created
}

function namesOnSide(side: SessionSummary['sides'][number]) {
  const members = side.members.map((name) => name.trim()).filter(Boolean)
  if (members.length > 0) return members
  const fallback = side.name.trim()
  return fallback ? [fallback] : []
}

function sortPlayers(players: PlayerRank[]) {
  return [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.winsIndividual !== a.winsIndividual) return b.winsIndividual - a.winsIndividual
    if (a.played !== b.played) return a.played - b.played
    return a.name.localeCompare(b.name, 'pt-BR')
  })
}

export function buildRanking(sessions: Session[]) {
  const players = new Map<string, PlayerRank>()
  const finished = sessions
    .filter((session) => session.status === 'finished')
    .sort((a, b) => (a.finishedAt ?? a.createdAt) - (b.finishedAt ?? b.createdAt))

  const matchesByGame: Record<string, number> = {}

  for (const session of finished) {
    const summary = sessionSummary(session)
    const grouped = summary.mode === 'groups'
    matchesByGame[session.gameId] = (matchesByGame[session.gameId] ?? 0) + 1

    for (const player of session.players) {
      const row = ensurePlayer(players, player.name)
      bump(row, 'played')
      bump(ensureGame(row, session.gameId), 'played')
    }

    for (const side of summary.sides) {
      if (!side.leader) continue
      for (const name of namesOnSide(side)) {
        const row = ensurePlayer(players, name)
        bump(row, 'wins')
        bump(row, grouped ? 'winsGroup' : 'winsIndividual')
        const game = ensureGame(row, session.gameId)
        bump(game, 'wins')
        bump(game, grouped ? 'winsGroup' : 'winsIndividual')
      }
    }
  }

  const ranked = sortPlayers([...players.values()])
  const games: GameRank[] = Object.entries(matchesByGame)
    .map(([gameId, played]) => ({
      gameId,
      played,
      players: sortPlayers(
        ranked
          .map((player) => {
            const counts = player.byGame[gameId]
            if (!counts) return null
            return { ...player, ...counts, byGame: { [gameId]: counts } }
          })
          .filter((player): player is PlayerRank => Boolean(player)),
      ),
    }))
    .sort((a, b) => b.played - a.played)

  return { players: ranked, games, matches: finished.length }
}

export function playersForGame(players: PlayerRank[], gameId: string) {
  return sortPlayers(
    players
      .map((player) => {
        const counts = player.byGame[gameId]
        if (!counts) return null
        return { ...player, ...counts, byGame: { [gameId]: counts } }
      })
      .filter((player): player is PlayerRank => Boolean(player)),
  )
}
