import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getGame, listGames } from '@/lib/game-registry'
import { buildRanking, playersForGame, type PlayerRank } from '@/lib/ranking'
import { cn } from '@/lib/utils'
import { listSessions, useSessionStore } from '@/stores/sessionStore'

type View = 'players' | 'games'
type PodiumRank = 1 | 2 | 3

const medals: Record<
  PodiumRank,
  { badge: string; fill: string; number: string; bar: string }
> = {
  1: {
    badge: 'bg-amber-400 text-amber-950 shadow-sm shadow-amber-400/40',
    fill: 'bg-amber-400/12',
    number: 'text-amber-700 dark:text-amber-400',
    bar: 'border-l-amber-400',
  },
  2: {
    badge: 'bg-zinc-300 text-zinc-800 shadow-sm shadow-zinc-400/30 dark:bg-zinc-300 dark:text-zinc-900',
    fill: 'bg-zinc-400/10',
    number: 'text-zinc-500 dark:text-zinc-300',
    bar: 'border-l-zinc-400',
  },
  3: {
    badge: 'bg-[#b87333] text-white shadow-sm shadow-[#b87333]/30',
    fill: 'bg-[#b87333]/12',
    number: 'text-[#9a5f28] dark:text-[#e0a060]',
    bar: 'border-l-[#b87333]',
  },
}

function medal(rank: number) {
  if (rank === 1 || rank === 2 || rank === 3) return medals[rank]
  return null
}

function playedLabel(count: number) {
  return count === 1 ? '1 partida' : `${count} partidas`
}

function StatLine({ player, className }: { player: PlayerRank; className?: string }) {
  return (
    <p className={cn('text-[11px] tabular-nums text-muted-foreground', className)}>
      Individual {player.winsIndividual}
      <span className="mx-1 text-border">·</span>
      Grupo {player.winsGroup}
      <span className="mx-1 text-border">·</span>
      {playedLabel(player.played)}
    </p>
  )
}

function RankBadge({ rank, large = false }: { rank: number; large?: boolean }) {
  const tone = medal(rank)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums',
        large ? 'size-8 text-sm' : 'size-7 text-xs',
        tone ? tone.badge : 'bg-muted text-muted-foreground',
      )}
    >
      {rank}
    </span>
  )
}

function gameWinsLine(player: PlayerRank) {
  return Object.entries(player.byGame)
    .filter(([, counts]) => counts.wins > 0)
    .sort((a, b) => b[1].wins - a[1].wins)
    .map(([gameId, counts]) => `${getGame(gameId)?.label ?? gameId} ${counts.wins}`)
    .join(' · ')
}

function PodiumCard({ player, rank }: { player: PlayerRank; rank: PodiumRank }) {
  const tone = medals[rank]
  const first = rank === 1
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center rounded-xl px-2 py-3 text-center ring-1',
        tone.fill,
        first
          ? 'ring-amber-400/45 sm:min-h-44 sm:py-5'
          : 'ring-transparent sm:min-h-36',
        rank === 2 && 'ring-zinc-400/40',
        rank === 3 && 'ring-[#b87333]/40',
      )}
    >
      {first ? <Trophy className="mb-1.5 size-5 text-amber-500" /> : null}
      <RankBadge rank={rank} large={first} />
      <p className={cn('mt-2 w-full truncate font-semibold', first ? 'text-base' : 'text-sm')}>
        {player.name}
      </p>
      <p className={cn('mt-1 font-bold tabular-nums leading-none', first ? 'text-3xl' : 'text-2xl', tone.number)}>
        {player.wins}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {player.wins === 1 ? 'vitória' : 'vitórias'}
      </p>
      <StatLine player={player} className="mt-2 w-full truncate" />
    </div>
  )
}

function Podium({ players }: { players: PlayerRank[] }) {
  const first = players[0]
  const second = players[1]
  const third = players[2]
  if (!first) return null
  if (!second) {
    return <PodiumCard player={first} rank={1} />
  }
  if (!third) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 sm:items-end">
        <div className="sm:order-2">
          <PodiumCard player={first} rank={1} />
        </div>
        <div className="sm:order-1">
          <PodiumCard player={second} rank={2} />
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:items-end">
      <div className="col-span-2 sm:order-2 sm:col-span-1">
        <PodiumCard player={first} rank={1} />
      </div>
      <div className="sm:order-1">
        <PodiumCard player={second} rank={2} />
      </div>
      <div className="sm:order-3">
        <PodiumCard player={third} rank={3} />
      </div>
    </div>
  )
}

function PlayerRow({
  player,
  rank,
  showGames = true,
}: {
  player: PlayerRank
  rank: number
  showGames?: boolean
}) {
  const games = gameWinsLine(player)
  const tone = medal(rank)

  return (
    <li
      className={cn(
        'flex items-center gap-3 border-b border-l-4 px-3 py-2.5 last:border-b-0',
        tone ? cn(tone.fill, tone.bar) : 'border-l-transparent',
      )}
    >
      <RankBadge rank={rank} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{player.name}</p>
        <StatLine player={player} className="mt-0.5" />
        {showGames && games ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{games}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-lg font-bold tabular-nums leading-none', tone?.number)}>
          {player.wins}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {player.wins === 1 ? 'vitória' : 'vitórias'}
        </p>
      </div>
    </li>
  )
}

export function Ranking() {
  const sessions = useSessionStore((s) => s.sessions)
  const ranking = useMemo(() => buildRanking(listSessions(sessions)), [sessions])
  const games = useMemo(() => listGames(), [])
  const [view, setView] = useState<View>('players')
  const [gameId, setGameId] = useState<string>('all')

  const recorded = useMemo(() => new Set(ranking.games.map((item) => item.gameId)), [ranking.games])
  const selectedGame = gameId !== 'all' && recorded.has(gameId) ? gameId : 'all'
  const playerRows =
    selectedGame === 'all' ? ranking.players : playersForGame(ranking.players, selectedGame)
  const rest = playerRows.slice(3)
  const gameBlocks = ranking.games
    .map((block) => {
      const game = games.find((item) => item.id === block.gameId) ?? getGame(block.gameId)
      return game ? { block, game } : null
    })
    .filter((item): item is { block: (typeof ranking.games)[number]; game: NonNullable<ReturnType<typeof getGame>> } =>
      Boolean(item),
    )

  return (
    <PageContainer>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Ranking</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Só partidas encerradas. Empate não conta vitória.
        </p>
      </header>

      <div className="mb-3 flex rounded-lg border p-0.5">
        <Button
          type="button"
          size="sm"
          variant={view === 'players' ? 'secondary' : 'ghost'}
          className="h-8 flex-1"
          onClick={() => setView('players')}
        >
          Por jogador
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === 'games' ? 'secondary' : 'ghost'}
          className="h-8 flex-1"
          onClick={() => setView('games')}
        >
          Por jogo
        </Button>
      </div>

      {ranking.matches === 0 ? (
        <Card className="bg-card/90">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">
              Encerre uma partida para o ranking começar a contar.
            </p>
            <Button asChild>
              <Link to="/novo">Novo jogo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : view === 'players' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={selectedGame === 'all' ? 'default' : 'outline'}
              onClick={() => setGameId('all')}
            >
              Todos
            </Button>
            {games.map((game) => {
              const hasRecords = recorded.has(game.id)
              return (
                <Button
                  key={game.id}
                  type="button"
                  size="sm"
                  variant={selectedGame === game.id ? 'default' : 'outline'}
                  disabled={!hasRecords}
                  onClick={() => setGameId(game.id)}
                >
                  {game.label}
                </Button>
              )
            })}
          </div>
          {playerRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém jogou esse ainda.</p>
          ) : (
            <>
              <Podium players={playerRows} />
              {rest.length > 0 ? (
                <Card className="overflow-hidden bg-card/90">
                  <ol>
                    {rest.map((player, index) => (
                      <PlayerRow key={player.key} player={player} rank={index + 4} />
                    ))}
                  </ol>
                </Card>
              ) : null}
            </>
          )}
        </div>
      ) : gameBlocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum jogo com partida encerrada.</p>
      ) : (
        <div className="space-y-3">
          {gameBlocks.map(({ block, game }) => {
            const Icon = game.icon
            return (
              <Card key={game.id} className="overflow-hidden bg-card/90">
                <div className="flex items-center gap-2 border-b px-3 py-2.5">
                  <Icon className="size-4 shrink-0 text-primary" />
                  <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{game.label}</h2>
                  <Badge variant="outline">{playedLabel(block.played)}</Badge>
                </div>
                <ol>
                  {block.players.map((player, index) => (
                    <PlayerRow
                      key={player.key}
                      player={player}
                      rank={index + 1}
                      showGames={false}
                    />
                  ))}
                </ol>
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
