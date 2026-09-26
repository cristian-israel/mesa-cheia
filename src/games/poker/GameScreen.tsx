import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  Dices,
  Plus,
  RotateCcw,
  Settings2,
  Trophy,
  UserMinus,
} from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { ToolsDrawer } from '@/components/tools/ToolsDrawer'
import {
  POKER_WIN_MODES,
  activePlayerIds,
  isEliminated,
  isZeroed,
  mesasWon,
} from '@/games/poker/schema'
import { usePokerStore } from '@/games/poker/store'
import { formatDuration, formatWhen, sessionDurationMs } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function PokerScreen({ sessionId }: { sessionId: string }) {
  const session = useSessionStore((s) => s.sessions[sessionId])
  const state = usePokerStore((s) => s.sessions[sessionId])
  const registerHand = usePokerStore((s) => s.registerHand)
  const nextDealer = usePokerStore((s) => s.nextDealer)
  const setDealer = usePokerStore((s) => s.setDealer)
  const setWinMode = usePokerStore((s) => s.setWinMode)
  const toggleEliminated = usePokerStore((s) => s.toggleEliminated)
  const toggleZeroed = usePokerStore((s) => s.toggleZeroed)
  const declareWinner = usePokerStore((s) => s.declareWinner)
  const clearWinner = usePokerStore((s) => s.clearWinner)
  const undoLastHand = usePokerStore((s) => s.undoLastHand)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mesaOpen, setMesaOpen] = useState(false)
  const [handOpen, setHandOpen] = useState(false)
  const [winnerOpen, setWinnerOpen] = useState(false)
  const [winnerPlayerId, setWinnerPlayerId] = useState('')

  if (!session || !state) {
    return (
      <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">Estado do Poker não encontrado.</p>
        <Button asChild className="mt-3">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    )
  }

  const finished = session.status === 'finished'
  const won = mesasWon(state)
  const playerIds = session.players.map((p) => p.id)
  const aliveIds = activePlayerIds(playerIds, state)
  const dealer = session.players.find((p) => p.id === state.dealerPlayerId)
  const handNumber = state.hands.length + 1
  const lastStanding = state.winMode === 'last-standing'
  const roundsMode = state.winMode === 'rounds'
  const maxMesas = Math.max(0, ...Object.values(won))
  const playerNames = session.players.filter((p) => aliveIds.includes(p.id)).map((p) => p.name)
  const alivePlayers = session.players.filter((p) => aliveIds.includes(p.id))
  const sessionWinner = session.players.find((p) => p.id === state.sessionWinnerId)
  const modeMeta = POKER_WIN_MODES.find((item) => item.id === state.winMode)

  function handleRegister() {
    if (!winnerPlayerId) {
      toast.message('Escolha quem levou a mão.')
      return
    }
    registerHand(sessionId, winnerPlayerId)
    nextDealer(sessionId)
    setWinnerPlayerId('')
    setHandOpen(false)
    toast.success('Mão lançada.')
  }

  function handleDeclareWinner() {
    if (!winnerPlayerId) {
      toast.message('Escolha quem venceu a noite.')
      return
    }
    declareWinner(sessionId, winnerPlayerId)
    setWinnerPlayerId('')
    setWinnerOpen(false)
    toast.success('Partida encerrada.')
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
          <h1 className="text-xl font-bold tracking-tight">Poker</h1>
          <p className="truncate text-xs text-muted-foreground">
            {finished
              ? sessionWinner
                ? `${sessionWinner.name} venceu`
                : 'Partida encerrada'
              : `${modeMeta?.label ?? 'Poker'} · Mão ${handNumber} · ${dealer?.name ?? '—'} dá as cartas`}
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
          const mesas = won[player.id] ?? 0
          const out = isEliminated(state, player.id)
          const zeroed = isZeroed(state, player.id)
          const sessionChamp = state.sessionWinnerId === player.id
          const leading =
            lastStanding &&
            !out &&
            maxMesas > 0 &&
            mesas === maxMesas &&
            Object.values(won).some((n) => n < maxMesas)
          const lastOne = lastStanding && aliveIds.length === 1 && aliveIds[0] === player.id
          const ahead = leading || lastOne || sessionChamp
          const dealing = player.id === state.dealerPlayerId
          return (
            <Card
              key={player.id}
              className={cn(
                'bg-card/90',
                (out || zeroed) && 'opacity-60',
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
                  {zeroed ? <Badge variant="secondary">Zerou</Badge> : null}
                  {sessionChamp ? <Badge>Venceu</Badge> : null}
                  {lastOne && finished ? <Badge>Levou tudo</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {lastStanding ? (
                  <>
                    <div>
                      <p className="text-3xl font-bold tabular-nums">{mesas}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {mesas === 1 ? 'mão' : 'mãos'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={finished || (aliveIds.length <= 1 && !out)}
                      onClick={() => toggleEliminated(sessionId, player.id)}
                    >
                      <UserMinus />
                      {out ? 'Voltar' : 'Saiu'}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => toggleZeroed(sessionId, player.id)}
                  >
                    <UserMinus />
                    {zeroed ? 'Desfazer zerou' : 'Zerou'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className={cn('mt-3 grid gap-2', roundsMode ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')}>
        <Button type="button" variant="outline" onClick={() => setMesaOpen(true)}>
          <Settings2 />
          Mesa
        </Button>
        <Button
          type="button"
          disabled={alivePlayers.length === 0 || finished}
          onClick={() => {
            setWinnerPlayerId('')
            setHandOpen(true)
          }}
        >
          <Plus />
          Nova mão
        </Button>
        {roundsMode ? (
          finished && state.sessionWinnerId ? (
            <Button
              type="button"
              variant="outline"
              className="col-span-2 sm:col-span-1"
              onClick={() => clearWinner(sessionId)}
            >
              Reabrir
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="col-span-2 sm:col-span-1"
              disabled={finished}
              onClick={() => {
                setWinnerPlayerId('')
                setWinnerOpen(true)
              }}
            >
              <Trophy />
              Quem venceu
            </Button>
          )
        ) : null}
      </div>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {state.hands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {roundsMode ? 'Nenhuma mão ainda. Toque em Nova mão.' : 'Nenhuma mão ainda.'}
            </p>
          ) : (
            <ol className="space-y-2">
              {[...state.hands].reverse().map((hand, reverseIndex) => {
                const index = state.hands.length - reverseIndex
                const winner = session.players.find((p) => p.id === hand.winnerPlayerId)
                const isLast = reverseIndex === 0
                return (
                  <li
                    key={hand.id}
                    className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-xs"
                  >
                    <p className="min-w-0 flex-1 font-medium">Mão {index}</p>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary bg-primary/10 px-2 py-1 font-semibold">
                      <Trophy className="size-3 text-primary" />
                      {winner?.name ?? '—'}
                    </span>
                    {isLast && !finished ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label="Desfazer última mão"
                        onClick={() => undoLastHand(sessionId)}
                      >
                        <RotateCcw />
                      </Button>
                    ) : null}
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
              Escolha o modo da noite e quem dá as cartas.
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

            <div>
              <Label>Modo</Label>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {POKER_WIN_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={finished}
                    onClick={() => setWinMode(sessionId, mode.id)}
                    className={cn(
                      'rounded-xl border bg-card/90 p-3 text-left transition-colors',
                      state.winMode === mode.id
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'hover:bg-accent/40',
                      finished && 'opacity-60',
                    )}
                  >
                    <p className="text-sm font-semibold">{mode.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{mode.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Mão
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{handNumber}</p>
              </div>
              <div>
                <Label htmlFor="dealer">Dá as cartas</Label>
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
          </div>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => setMesaOpen(false)}>
              Fechar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={handOpen} onOpenChange={setHandOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nova mão</DrawerTitle>
            <DrawerDescription>
              {roundsMode
                ? 'Só registra quem levou esta mão — sem placar de pontos.'
                : 'Registra quem levou a mão.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-2">
            <div>
              <Label htmlFor="hand-winner">Levou a mão</Label>
              <select
                id="hand-winner"
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
              Lançar mão
            </Button>
            <Button type="button" variant="ghost" onClick={() => setHandOpen(false)}>
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={winnerOpen} onOpenChange={setWinnerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Quem venceu</DrawerTitle>
            <DrawerDescription>
              Encerra a noite com o vencedor. Quem zerou fica marcado no placar.
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-2">
            <div>
              <Label htmlFor="session-winner">Vencedor</Label>
              <select
                id="session-winner"
                value={winnerPlayerId}
                onChange={(e) => setWinnerPlayerId(e.target.value)}
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm shadow-sm"
              >
                <option value="">Escolher…</option>
                {session.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                    {isZeroed(state, player.id) ? ' (zerou)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DrawerFooter>
            <Button type="button" disabled={!winnerPlayerId} onClick={handleDeclareWinner}>
              Encerrar partida
            </Button>
            <Button type="button" variant="ghost" onClick={() => setWinnerOpen(false)}>
              Cancelar
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
