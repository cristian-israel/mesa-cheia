import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Dices, Plus, RotateCcw, Settings2, Trophy, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DealerMark } from '@/components/game/DealerMark'
import { GameGuideButton } from '@/components/game/GameGuideButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToolsDrawer } from '@/components/tools/ToolsDrawer'
import { activePlayerIds, isEliminated, partidasWon } from '@/games/coup/schema'
import { useCoupStore } from '@/games/coup/store'
import { formatDuration, formatWhen, sessionDurationMs } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function CoupScreen({ sessionId }: { sessionId: string }) {
  const session = useSessionStore((s) => s.sessions[sessionId])
  const state = useCoupStore((s) => s.sessions[sessionId])
  const registerPartida = useCoupStore((s) => s.registerPartida)
  const nextDealer = useCoupStore((s) => s.nextDealer)
  const setDealer = useCoupStore((s) => s.setDealer)
  const setWinMode = useCoupStore((s) => s.setWinMode)
  const setTargetPartidas = useCoupStore((s) => s.setTargetPartidas)
  const toggleEliminated = useCoupStore((s) => s.toggleEliminated)
  const undoLastPartida = useCoupStore((s) => s.undoLastPartida)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mesaOpen, setMesaOpen] = useState(false)
  const [partidaOpen, setPartidaOpen] = useState(false)
  const [winnerPlayerId, setWinnerPlayerId] = useState('')
  const [targetDraft, setTargetDraft] = useState<string>()

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
  const dealer = session.players.find((p) => p.id === state.dealerPlayerId)
  const partidaNumber = state.partidas.length + 1
  const lastStanding = state.winMode === 'last-standing'
  const maxPartidas = Math.max(0, ...Object.values(won))
  const playerNames = session.players.filter((p) => aliveIds.includes(p.id)).map((p) => p.name)
  const alivePlayers = session.players.filter((p) => aliveIds.includes(p.id))

  function handleRegister() {
    if (!winnerPlayerId) {
      toast.message('Escolha quem venceu a partida.')
      return
    }
    registerPartida(sessionId, winnerPlayerId)
    nextDealer(sessionId)
    setWinnerPlayerId('')
    setPartidaOpen(false)
    toast.success('Partida registrada.')
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
              : `Partida ${partidaNumber} · ${dealer?.name ?? '—'} começa`}
          </p>
        </div>
        {finished ? <Badge>Fim</Badge> : null}
        <GameGuideButton />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Configurações da mesa"
          onClick={() => setMesaOpen(true)}
        >
          <Settings2 />
        </Button>
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
          const lastOne = lastStanding && aliveIds.length === 1 && aliveIds[0] === player.id
          const ahead = leading || lastOne
          const dealing = player.id === state.dealerPlayerId
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
                    {dealing ? <DealerMark /> : null}
                  </CardTitle>
                  {out ? <Badge variant="secondary">Saiu</Badge> : null}
                  {lastOne && finished ? <Badge>Último de pé</Badge> : null}
                  {!lastStanding && partidas >= state.targetPartidas ? <Badge>Alvo</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-3xl font-bold tabular-nums">{partidas}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {partidas === 1 ? 'vitória' : 'vitórias'}
                  </p>
                </div>
                {lastStanding ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={aliveIds.length <= 1 && !out}
                    onClick={() => toggleEliminated(sessionId, player.id)}
                  >
                    <UserMinus />
                    {out ? 'Voltar' : 'Saiu'}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => setMesaOpen(true)}>
          <Settings2 />
          Mesa
        </Button>
        <Button
          type="button"
          disabled={alivePlayers.length === 0}
          onClick={() => setPartidaOpen(true)}
        >
          <Plus />
          Nova partida
        </Button>
      </div>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {state.partidas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma partida ainda.</p>
          ) : (
            <ol className="space-y-2">
              {state.partidas.map((partida, index) => {
                const winner = session.players.find((p) => p.id === partida.winnerPlayerId)
                return (
                  <li
                    key={partida.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-background/50 px-3 py-2 text-xs"
                  >
                    <p className="font-medium">Partida {index + 1}</p>
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary/10 px-2 py-1 font-semibold">
                      <Trophy className="size-3 text-primary" />
                      {winner?.name ?? '—'}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <Drawer open={mesaOpen} onOpenChange={setMesaOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mesa</DrawerTitle>
            <DrawerDescription>
              Quem começa, e se a mesa acaba quando só resta um ou num alvo de vitórias.
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-2">
            <div className="rounded-lg border bg-card/90 px-3 py-2 text-xs text-muted-foreground">
              <p>Início {formatWhen(session.createdAt)}</p>
              {finished && session.finishedAt ? <p>Fim {formatWhen(session.finishedAt)}</p> : null}
              {!finished || session.finishedAt ? (
                <p>
                  {finished ? 'Duração' : 'Decorrido'}{' '}
                  {formatDuration(sessionDurationMs(session.createdAt, session.finishedAt))}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Partida
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{partidaNumber}</p>
              </div>
              <div>
                <Label htmlFor="dealer">Começa</Label>
                <div className="mt-1.5 flex gap-2">
                  <select
                    id="dealer"
                    disabled={finished}
                    value={state.dealerPlayerId}
                    onChange={(e) => setDealer(sessionId, e.target.value)}
                    className="flex h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm shadow-sm"
                  >
                    {alivePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={finished}
                    onClick={() => nextDealer(sessionId)}
                  >
                    Próximo
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/90 px-3 py-2">
              <div>
                <Label htmlFor="win-mode">Quem sobrar ganha</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {lastStanding
                    ? 'A mesa acaba quando só resta um com influência.'
                    : 'Desligado: vale o alvo de vitórias.'}
                </p>
              </div>
              <Switch
                id="win-mode"
                checked={lastStanding}
                disabled={finished}
                onCheckedChange={(checked) =>
                  setWinMode(sessionId, checked ? 'last-standing' : 'target')
                }
              />
            </div>

            {!lastStanding ? (
              <div>
                <Label htmlFor="target-partidas">Alvo (vitórias)</Label>
                <Input
                  id="target-partidas"
                  className="mt-1.5"
                  inputMode="numeric"
                  value={targetDraft ?? String(state.targetPartidas)}
                  disabled={finished}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  onBlur={() => {
                    const value = Number(targetDraft)
                    if (Number.isInteger(value) && value >= 1) {
                      setTargetPartidas(sessionId, value)
                    }
                    setTargetDraft(undefined)
                  }}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Quem levar {state.targetPartidas}{' '}
                  {state.targetPartidas === 1 ? 'vitória' : 'vitórias'} fecha.
                </p>
              </div>
            ) : null}
          </div>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => setMesaOpen(false)}>
              Fechar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={partidaOpen} onOpenChange={setPartidaOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nova partida</DrawerTitle>
            <DrawerDescription>Só registra quem venceu.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-2">
            <div>
              <Label htmlFor="winner">Venceu</Label>
              <select
                id="winner"
                disabled={finished}
                value={winnerPlayerId}
                onChange={(e) => setWinnerPlayerId(e.target.value)}
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm shadow-sm"
              >
                <option value="">Escolher…</option>
                {alivePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DrawerFooter>
            <Button type="button" disabled={finished || !winnerPlayerId} onClick={handleRegister}>
              Registrar
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={state.partidas.length === 0}
              onClick={() => undoLastPartida(sessionId)}
            >
              <RotateCcw />
              Desfazer última
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
