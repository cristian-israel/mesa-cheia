import { Link } from 'react-router-dom'
import { Clock, Timer, Trash2, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getGame, type SessionSummary } from '@/lib/game-registry'
import { scoringSides } from '@/lib/teams'
import { formatDuration, formatWhen, sessionDurationMs } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { Session } from '@/schemas/session'

function formatPoints(value: number) {
  return value.toLocaleString('pt-BR')
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

type SessionCardProps = {
  session: Session
  onDelete: (id: string) => void
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const game = getGame(session.gameId)
  const summary = game?.summarizeSession?.(session) ?? fallbackSummary(session)
  const finished = session.status === 'finished'
  const winner = summary.sides.find((side) => side.leader)
  const duration =
    !finished || session.finishedAt
      ? formatDuration(sessionDurationMs(session.createdAt, session.finishedAt))
      : null

  return (
    <Card
      className={cn(
        'overflow-hidden bg-card/90 transition-colors hover:bg-card',
        finished && winner && 'ring-1 ring-primary/30',
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-start gap-2 px-3 pt-3">
          <Link to={`/jogo/${session.gameId}/${session.id}`} className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold tracking-tight">{game?.label ?? session.gameId}</p>
              <Badge variant="outline">{summary.modeLabel}</Badge>
              {finished ? (
                <Badge variant="secondary">Encerrada</Badge>
              ) : (
                <Badge>Em jogo</Badge>
              )}
            </div>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Excluir partida"
            className="size-8 shrink-0"
            onClick={() => onDelete(session.id)}
          >
            <Trash2 />
          </Button>
        </div>

        <Link to={`/jogo/${session.gameId}/${session.id}`} className="block px-3 pb-3 pt-2">
          <ul className="overflow-hidden rounded-lg border bg-background/60">
            {summary.sides.map((side) => {
              const members =
                summary.mode === 'groups' && side.members.length > 0
                  ? side.members.join(' · ')
                  : null
              const showMembers = Boolean(members && members !== side.name)
              return (
                <li
                  key={side.id}
                  className={cn(
                    'flex items-center gap-2 border-b px-2.5 py-2 last:border-b-0',
                    side.leader && 'bg-primary/10',
                  )}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center">
                    {side.leader ? (
                      <Trophy className="size-3.5 text-primary" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm',
                        side.leader ? 'font-semibold text-foreground' : 'font-medium',
                      )}
                    >
                      {side.name}
                    </p>
                    {showMembers ? (
                      <p className="truncate text-[11px] text-muted-foreground">{members}</p>
                    ) : null}
                  </div>
                  {side.score != null ? (
                    <p
                      className={cn(
                        'shrink-0 text-right text-base tabular-nums',
                        side.leader ? 'font-bold text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {formatPoints(side.score)}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <TimeCell icon={Clock} label="Início" value={formatWhen(session.createdAt)} />
            {finished && session.finishedAt ? (
              <TimeCell icon={Clock} label="Fim" value={formatWhen(session.finishedAt)} />
            ) : (
              <TimeCell icon={Clock} label="Fim" value="—" />
            )}
            <TimeCell
              icon={Timer}
              label={finished ? 'Duração' : 'Decorrido'}
              value={duration ?? '—'}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

function TimeCell({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Clock
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('rounded-md bg-background/50 px-2 py-1.5', className)}>
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="mt-0.5 truncate text-[11px] tabular-nums text-foreground">{value}</p>
    </div>
  )
}
