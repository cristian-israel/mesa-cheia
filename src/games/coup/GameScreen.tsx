import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Dices, RotateCcw, Trophy, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DealerMark } from '@/components/game/DealerMark'
import { GameGuideButton } from '@/components/game/GameGuideButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToolsDrawer } from '@/components/tools/ToolsDrawer'
import {
  activePlayerIds,
  currentPartidaNumber,
  isEliminated,
  partidasWon,
} from '@/games/coup/schema'
import { useCoupStore } from '@/games/coup/store'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function CoupScreen({ sessionId }: { sessionId: string }) {
  const session = useSessionStore((s) => s.sessions[sessionId])
  const state = useCoupStore((s) => s.sessions[sessionId])
  const markOut = useCoupStore((s) => s.markOut)
  const undoOut = useCoupStore((s) => s.undoOut)
  const startNextPartida = useCoupStore((s) => s.startNextPartida)
  const undoLastEvent = useCoupStore((s) => s.undoLastEvent)
  const [toolsOpen, setToolsOpen] = useState(false)

  if (!session || !state) {
    return (
      <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">Estado do Coup não encontrado.</p>
        <Button asChild className="mt-3">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    )
  }

  const finished = session.status === 'finished'
  const won = partidasWon(state)
  const playerIds = session.players.map((p) => p.id)
  const aliveIds = activePlayerIds(playerIds, state)
  const starter = session.players.find((p) => p.id === state.starterPlayerId)
  const partidaNumber = currentPartidaNumber(state)
  const maxPartidas = Math.max(0, ...Object.values(won))
  const playerNames = session.players.map((p) => p.name)
  const recent = [...state.events].reverse()
  const soleSurvivor = finished && aliveIds.length === 1 ? aliveIds[0] : null

  function handleOut(playerId: string) {
    const player = session.players.find((p) => p.id === playerId)
    markOut(sessionId, playerId)
    toast.message(`${player?.name ?? 'Alguém'} saiu.`)
  }

  function handleBack(playerId: string) {
    undoOut(sessionId, playerId)
  }

  function handleNovaPartida() {
    startNextPartida(sessionId)
    toast.success('Nova partida.')
  }

  return (
    <div className="relative z-10 mx-auto min-h-dvh w-full max-w-lg px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] md:max-w-4xl md:pb-10 md:pt-6">
      <header className="mb-3 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link to="/">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight">Coup</h1>
          <p className="truncate text-xs text-muted-foreground">
            {finished
              ? 'Partida encerrada'
              : `Partida ${partidaNumber} · ${starter?.name ?? '—'} começa`}
          </p>
        </div>
        {finished ? <Badge>Fim</Badge> : null}
        <GameGuideButton />
      </header>

      <div className={cn('grid gap-3', session.players.length > 1 && 'grid-cols-2')}>
        {session.players.map((player) => {
          const partidas = won[player.id] ?? 0
          const out = isEliminated(state, player.id)
          const leading =
            !out &&
            maxPartidas > 0 &&
            partidas === maxPartidas &&
            Object.values(won).some((n) => n < maxPartidas)
          const lastOne = soleSurvivor === player.id
          const ahead = leading || lastOne
          const starting = player.id === state.starterPlayerId && !out
          return (
            <Card
              key={player.id}
              className={cn(
                'bg-card/90',
                out && 'opacity-60',
                ahead && 'border-primary bg-primary/10 ring-2 ring-primary/30',
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-1">
                  <CardTitle className="flex min-w-0 items-center gap-1.5">
                    {ahead ? <Trophy className="size-4 shrink-0 text-primary" /> : null}
                    <span className="truncate">{player.name}</span>
                    {starting ? <DealerMark /> : null}
                  </CardTitle>
                  {out ? <Badge variant="secondary">Saiu</Badge> : null}
                  {lastOne ? <Badge>Último de pé</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-3xl font-bold tabular-nums">{partidas}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {partidas === 1 ? 'vitória' : 'vitórias'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={finished || (aliveIds.length <= 1 && !out)}
                  onClick={() => (out ? handleBack(player.id) : handleOut(player.id))}
                >
                  {out ? <UserPlus /> : <UserMinus />}
                  {out ? 'Voltar' : 'Saiu'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-3">
        <Button type="button" className="w-full" onClick={handleNovaPartida}>
          Nova partida
        </Button>
      </div>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Histórico</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={state.events.length === 0}
            onClick={() => undoLastEvent(sessionId)}
          >
            <RotateCcw />
            Desfazer
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada ainda. Marque quem saiu.</p>
          ) : (
            <ol className="space-y-2">
              {recent.map((event) => {
                const player = session.players.find((p) => p.id === event.playerId)
                return (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-background/50 px-3 py-2 text-xs"
                  >
                    <p className="font-medium">Partida {event.partidaNumber}</p>
                    {event.kind === 'win' ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary/10 px-2 py-1 font-semibold">
                        <Trophy className="size-3 text-primary" />
                        {player?.name ?? '—'} venceu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-semibold text-muted-foreground">
                        <UserMinus className="size-3" />
                        {player?.name ?? '—'} saiu
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <Button
        type="button"
        size="lg"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 rounded-full shadow-lg md:bottom-6"
        onClick={() => setToolsOpen(true)}
      >
        <Dices />
        Ferramentas
      </Button>

      <ToolsDrawer open={toolsOpen} onOpenChange={setToolsOpen} items={playerNames} />
    </div>
  )
}
