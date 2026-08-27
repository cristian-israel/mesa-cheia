import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PlayerOrder } from '@/components/session/PlayerOrder'
import { PlayerPicker } from '@/components/session/PlayerPicker'
import { TeamBuilder } from '@/components/session/TeamBuilder'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { listGames, type GameDefinition } from '@/lib/game-registry'
import {
  alternatePlayerOrder,
  createEmptyTeams,
  groupSizeLabel,
  groupSizeOptions,
  teamsAreComplete,
} from '@/lib/teams'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'
import type { Player, Team } from '@/schemas/session'

type Step = 'game' | 'players' | 'teams' | 'order'
type PlayMode = 'individual' | 'groups'

export function NovoJogo() {
  const navigate = useNavigate()
  const createSession = useSessionStore((s) => s.createSession)
  const games = useMemo(() => listGames(), [])

  const [step, setStep] = useState<Step>('game')
  const [game, setGame] = useState<GameDefinition | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [mode, setMode] = useState<PlayMode>('individual')
  const [teamSize, setTeamSize] = useState(2)
  const [teams, setTeams] = useState<Team[]>([])
  const [order, setOrder] = useState<Player[]>([])

  const sizes = groupSizeOptions(players.length)

  function pickGame(def: GameDefinition) {
    setGame(def)
    setPlayers([])
    setTeams([])
    setOrder([])
    setMode('individual')
    setStep('players')
  }

  function goAfterPlayers() {
    if (!game) return
    if (players.length < game.minPlayers || players.length > game.maxPlayers) {
      toast.message(`Escolha de ${game.minPlayers} a ${game.maxPlayers} jogadores.`)
      return
    }
    if (game.supportsTeams && mode === 'groups') {
      if (sizes.length === 0) {
        toast.message('Com esse número de pessoas não dá para fechar grupos iguais.')
        return
      }
      const size = sizes.includes(teamSize) ? teamSize : sizes.includes(2) ? 2 : sizes[0]
      setTeamSize(size)
      setTeams(createEmptyTeams(players.length, size))
      setStep('teams')
      return
    }
    setTeams([])
    setOrder([...players])
    setStep('order')
  }

  function changeTeamSize(size: number) {
    setTeamSize(size)
    setTeams(createEmptyTeams(players.length, size))
  }

  function goToOrder() {
    if (mode === 'groups' && !teamsAreComplete(teams, players, teamSize)) {
      toast.message('Monte os grupos antes de seguir.')
      return
    }
    setOrder(mode === 'groups' ? alternatePlayerOrder(players, teams) : [...players])
    setStep('order')
  }

  function goBack() {
    if (step === 'order') {
      setStep(mode === 'groups' && game?.supportsTeams ? 'teams' : 'players')
      return
    }
    if (step === 'teams') {
      setStep('players')
      return
    }
    setStep('game')
  }

  function startGame() {
    if (!game || order.length === 0) return
    const sessionTeams = mode === 'groups' ? teams : undefined
    if (mode === 'groups' && !teamsAreComplete(teams, players, teamSize)) {
      toast.message('Monte os grupos antes de começar.')
      return
    }
    const session = createSession({
      gameId: game.id,
      players: order,
      teams: sessionTeams,
    })
    game.createInitialState(session.id, order, sessionTeams)
    navigate(`/jogo/${game.id}/${session.id}`)
  }

  return (
    <PageContainer>
      <header className="mb-4 flex items-center gap-2">
        {step !== 'game' ? (
          <Button type="button" variant="ghost" size="icon" aria-label="Voltar" onClick={goBack}>
            <ChevronLeft />
          </Button>
        ) : null}
        <div>
          <h1 className="text-xl font-bold tracking-tight">Novo jogo</h1>
          <p className="text-xs text-muted-foreground">
            {step === 'game' && 'Escolha o que vai rolar na mesa.'}
            {step === 'players' &&
              'Pelo menos 2 pessoas. Escolha se é individual ou em grupo.'}
            {step === 'teams' && 'Monte os grupos.'}
            {step === 'order' && 'Ordem dos jogadores.'}
          </p>
        </div>
      </header>

      {step === 'game' ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {games.map((def) => {
            const Icon = def.icon
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => pickGame(def)}
                className="rounded-xl border bg-card/90 p-3 text-left transition-colors hover:bg-accent/40"
              >
                <Icon className="mb-2 size-5 text-primary" />
                <p className="font-semibold">{def.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {def.minPlayers === def.maxPlayers
                    ? `${def.minPlayers} jogadores`
                    : `${def.minPlayers}–${def.maxPlayers} jogadores`}
                </p>
              </button>
            )
          })}
        </div>
      ) : null}

      {step === 'players' && game ? (
        <div className="space-y-4">
          {game.supportsTeams ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('individual')}
                className={cn(
                  'rounded-xl border bg-card/90 p-3 text-left transition-colors',
                  mode === 'individual'
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'hover:bg-accent/40',
                )}
              >
                <User className="mb-1.5 size-4 text-primary" />
                <p className="text-sm font-semibold">Individual</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Cada um no próprio placar.</p>
              </button>
              <button
                type="button"
                onClick={() => setMode('groups')}
                className={cn(
                  'rounded-xl border bg-card/90 p-3 text-left transition-colors',
                  mode === 'groups' ? 'border-primary ring-2 ring-primary/30' : 'hover:bg-accent/40',
                )}
              >
                <Users className="mb-1.5 size-4 text-primary" />
                <p className="text-sm font-semibold">Grupos</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Duplas, trios e afins.</p>
              </button>
            </div>
          ) : null}
          {game.supportsTeams && mode === 'groups' && players.length >= game.minPlayers && sizes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Com {players.length} pessoas, grupos iguais não fecham — use individual ou mude o
              elenco.
            </p>
          ) : null}
          <Card className="bg-card/90">
            <CardContent className="p-3">
              <PlayerPicker
                selected={players}
                onChange={setPlayers}
                minPlayers={game.minPlayers}
                maxPlayers={game.maxPlayers}
              />
            </CardContent>
          </Card>
          <Button
            className="w-full"
            size="lg"
            disabled={
              players.length < game.minPlayers ||
              (mode === 'groups' && game.supportsTeams && sizes.length === 0)
            }
            onClick={goAfterPlayers}
          >
            {mode === 'groups' && game.supportsTeams ? 'Montar grupos' : 'Definir ordem'}
          </Button>
        </div>
      ) : null}

      {step === 'teams' ? (
        <div className="space-y-4">
          {sizes.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((size) => (
                <Button
                  key={size}
                  type="button"
                  size="sm"
                  variant={teamSize === size ? 'default' : 'outline'}
                  onClick={() => changeTeamSize(size)}
                >
                  {groupSizeLabel(size)}
                </Button>
              ))}
            </div>
          ) : null}
          <TeamBuilder players={players} teamSize={teamSize} value={teams} onChange={setTeams} />
          <Button
            className="w-full"
            size="lg"
            disabled={!teamsAreComplete(teams, players, teamSize)}
            onClick={goToOrder}
          >
            Definir ordem
          </Button>
        </div>
      ) : null}

      {step === 'order' ? (
        <div className="space-y-4">
          <Card className="bg-card/90">
            <CardContent className="p-3">
              <PlayerOrder
                players={order}
                teams={mode === 'groups' ? teams : undefined}
                onChange={setOrder}
                onAlternate={
                  mode === 'groups'
                    ? () => setOrder(alternatePlayerOrder(players, teams))
                    : undefined
                }
              />
            </CardContent>
          </Card>
          <Button className="w-full" size="lg" disabled={order.length === 0} onClick={startGame}>
            Começar partida
          </Button>
        </div>
      ) : null}

      {games.length === 0 ? (
        <p className={cn('text-sm text-muted-foreground')}>Nenhum jogo registrado.</p>
      ) : null}
    </PageContainer>
  )
}
