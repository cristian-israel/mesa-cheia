import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRosterStore } from '@/stores/rosterStore'
import type { Player } from '@/schemas/session'
import { cn } from '@/lib/utils'

type PlayerPickerProps = {
  selected: Player[]
  onChange: (players: Player[]) => void
  minPlayers: number
  maxPlayers: number
}

export function PlayerPicker({ selected, onChange, minPlayers, maxPlayers }: PlayerPickerProps) {
  const roster = useRosterStore((s) => s.players)
  const addToRoster = useRosterStore((s) => s.addPlayer)
  const removeFromRoster = useRosterStore((s) => s.removePlayer)
  const [name, setName] = useState('')

  const selectedIds = new Set(selected.map((p) => p.id))
  const atMax = selected.length >= maxPlayers
  const missing = Math.max(0, minPlayers - selected.length)

  function toggle(player: Player) {
    if (selectedIds.has(player.id)) {
      onChange(selected.filter((p) => p.id !== player.id))
      return
    }
    if (atMax) return
    onChange([...selected, player])
  }

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed || atMax) return
    const player = addToRoster(trimmed)
    if (!selectedIds.has(player.id)) {
      onChange([...selected, player])
    }
    setName('')
  }

  function handleDelete(player: Player) {
    if (selectedIds.has(player.id)) {
      onChange(selected.filter((p) => p.id !== player.id))
    }
    removeFromRoster(player.id)
    toast.message(`${player.name} saiu do elenco.`)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do jogador"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          disabled={atMax}
        />
        <Button type="button" onClick={handleAdd} disabled={!name.trim() || atMax}>
          Adicionar
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {selected.length} nesta partida · mínimo {minPlayers}, até {maxPlayers}
        {missing > 0 ? ` · faltam ${missing}` : ''}
      </p>

      {roster.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Elenco salvo
          </p>
          <p className="text-[11px] text-muted-foreground">
            Toque no nome para entrar ou sair desta partida. A lixeira apaga do elenco — se digitou
            errado, por exemplo.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {roster.map((player) => {
              const active = selectedIds.has(player.id)
              return (
                <div
                  key={player.id}
                  className={cn(
                    'flex overflow-hidden rounded-md border',
                    active ? 'border-primary' : 'border-input',
                    atMax && !active && 'opacity-50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(player)}
                    className={cn(
                      'px-2 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card/90 hover:bg-accent/40',
                    )}
                  >
                    {player.name}
                  </button>
                  <button
                    type="button"
                    title={`Apagar ${player.name} do elenco`}
                    aria-label={`Apagar ${player.name} do elenco`}
                    onClick={() => handleDelete(player)}
                    className="border-l border-inherit px-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Cadastre os nomes. Eles ficam neste aparelho para as próximas mesas.
        </p>
      )}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((player, index) => (
            <Badge key={player.id} variant="secondary">
              {index + 1}. {player.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
