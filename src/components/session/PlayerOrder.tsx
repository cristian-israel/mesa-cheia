import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { teamNameForPlayer } from '@/lib/teams'
import { cn } from '@/lib/utils'
import type { Player, Team } from '@/schemas/session'

type PlayerOrderProps = {
  players: Player[]
  teams?: Team[]
  onChange: (players: Player[]) => void
  onAlternate?: () => void
}

export function PlayerOrder({ players, teams, onChange, onAlternate }: PlayerOrderProps) {
  function move(index: number, delta: number) {
    const next = index + delta
    if (next < 0 || next >= players.length) return
    const copy = [...players]
    const [item] = copy.splice(index, 1)
    copy.splice(next, 0, item)
    onChange(copy)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Ordem de quem dá as cartas e joga.</p>
        {onAlternate ? (
          <Button type="button" variant="outline" size="sm" onClick={onAlternate}>
            Alternar grupos
          </Button>
        ) : null}
      </div>
      <ol className="grid gap-1.5">
        {players.map((player, index) => {
          const group = teamNameForPlayer(player.id, teams)
          return (
            <li
              key={player.id}
              className="flex items-center gap-2 rounded-lg border bg-card/90 px-2 py-1.5"
            >
              <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{player.name}</p>
                {group ? <p className="truncate text-[11px] text-muted-foreground">{group}</p> : null}
              </div>
              <div className="flex shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Subir ${player.name}`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className={cn('size-8')}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Descer ${player.name}`}
                  disabled={index === players.length - 1}
                  onClick={() => move(index, 1)}
                  className="size-8"
                >
                  <ChevronDown />
                </Button>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
