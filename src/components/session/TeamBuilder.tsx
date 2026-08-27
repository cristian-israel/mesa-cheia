import type { Player, Team } from '@/schemas/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { groupNoun } from '@/lib/teams'
import { cn } from '@/lib/utils'

type TeamBuilderProps = {
  players: Player[]
  teamSize: number
  value: Team[]
  onChange: (teams: Team[]) => void
}

export function TeamBuilder({ players, teamSize, value, onChange }: TeamBuilderProps) {
  function setTeamName(teamId: string, name: string) {
    onChange(value.map((team) => (team.id === teamId ? { ...team, name } : team)))
  }

  function assignPlayer(playerId: string, teamId: string) {
    onChange(
      value.map((team) => {
        const without = team.playerIds.filter((id) => id !== playerId)
        if (team.id !== teamId) return { ...team, playerIds: without }
        if (team.playerIds.includes(playerId)) return { ...team, playerIds: without }
        if (team.playerIds.length >= teamSize) return team
        return { ...team, playerIds: [...without, playerId] }
      }),
    )
  }

  function autoPair() {
    onChange(
      value.map((team, index) => ({
        ...team,
        playerIds: players.slice(index * teamSize, index * teamSize + teamSize).map((p) => p.id),
      })),
    )
  }

  const assigned = new Set(value.flatMap((t) => t.playerIds))
  const complete =
    value.every((t) => t.playerIds.length === teamSize) && assigned.size === players.length

  const noun = groupNoun(teamSize, value.length)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {value.length} {noun} de {teamSize}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={autoPair}>
          Montar na ordem
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {value.map((team) => (
          <div key={team.id} className="rounded-xl border bg-card/90 p-3">
            <Label htmlFor={`team-${team.id}`}>Nome do grupo</Label>
            <Input
              id={`team-${team.id}`}
              className="mt-1.5"
              value={team.name}
              onChange={(e) => setTeamName(team.id, e.target.value)}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {team.playerIds.length}/{teamSize}
            </p>
            <div className="mt-2 grid gap-1.5">
              {players.map((player) => {
                const inThis = team.playerIds.includes(player.id)
                const taken = assigned.has(player.id) && !inThis
                const full = !inThis && team.playerIds.length >= teamSize
                return (
                  <button
                    key={player.id}
                    type="button"
                    disabled={full}
                    onClick={() => assignPlayer(player.id, team.id)}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-left text-xs font-medium transition-colors',
                      inThis
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'bg-background/60 hover:bg-accent/40',
                      full && 'opacity-40',
                      taken && !full && 'opacity-60',
                    )}
                  >
                    {player.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!complete ? (
        <p className="text-xs text-muted-foreground">
          Toque de novo para tirar do grupo, ou toque noutro grupo para trocar.
        </p>
      ) : null}
    </div>
  )
}
