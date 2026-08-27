import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Dices, Plus, RotateCcw, Settings2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { ToolsDrawer } from '@/components/tools/ToolsDrawer'
import { PIFE_TARGETS, pifesWon } from '@/games/pife/schema'
import { usePifeStore } from '@/games/pife/store'
import { formatDuration, formatWhen, sessionDurationMs } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function PifeScreen({ sessionId }: { sessionId: string }) {
  const session = useSessionStore((s) => s.sessions[sessionId])
  const state = usePifeStore((s) => s.sessions[sessionId])
  const registerPife = usePifeStore((s) => s.registerPife)
  const nextDealer = usePifeStore((s) => s.nextDealer)
  const setDealer = usePifeStore((s) => s.setDealer)
  const setTargetScore = usePifeStore((s) => s.setTargetScore)
  const undoRound = usePifeStore((s) => s.undoRound)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mesaOpen, setMesaOpen] = useState(false)
  const [roundOpen, setRoundOpen] = useState(false)
  const [targetDraft, setTargetDraft] = useState<string>()

  if (!session || !state) {
    return (
      <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">Estado do Pife não encontrado.</p>
        <Button asChild className="mt-3">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    )
  }

  const finished = session.status === 'finished'
  const won = pifesWon(state)
  const dealer = session.players.find((p) => p.id === state.dealerPlayerId)
  const roundNumber = state.rounds.length + 1
  const playerNames = session.players.map((p) => p.name)
  const scores = session.players.map((player) => won[player.id] ?? 0)
  const maxScore = Math.max(0, ...scores)
  const scoresTied = scores.length > 1 && scores.every((score) => score === maxScore)
  const recent = [...state.rounds].reverse()

  function handleRegister(winnerPlayerId: string) {
    if (finished) return
    const winner = session.players.find((player) => player.id === winnerPlayerId)
    registerPife(sessionId, winnerPlayerId)
    nextDealer(sessionId)
    setRoundOpen(false)
    toast.success(`${winner?.name ?? 'Alguém'} bateu.`)
  }

  function commitTarget() {
    const value = Number(targetDraft)
    if (Number.isInteger(value) && value >= 1 && value !== state.targetScore) {
      setTargetScore(sessionId, value)
    }
    setTargetDraft(undefined)
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
          <h1 className="text-xl font-bold tracking-tight">Pife</h1>
          <p className="truncate text-xs text-muted-foreground">
            {finished
              ? 'Partida encerrada'
              : `Até ${state.targetScore} · ${dealer?.name ?? '—'} dá as cartas`}
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
          const pifes = won[player.id] ?? 0
          const closed = pifes >= state.targetScore
          const leading = !closed && maxScore > 0 && !scoresTied && pifes === maxScore
          return (
            <Card
              key={player.id}
              className={cn(
                'bg-card/90',
                leading && 'border-primary bg-primary/10 ring-2 ring-primary/30',
                closed && 'border-primary bg-primary/10 ring-2 ring-primary/50',
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-1">
                  <CardTitle className="flex min-w-0 items-center gap-1.5">
                    {leading || closed ? <Trophy className="size-4 shrink-0 text-primary" /> : null}
                    <span className="truncate">{player.name}</span>
                  </CardTitle>
                  {closed ? <Badge>Fechou</Badge> : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{pifes}</p>
                <p className="text-[11px] text-muted-foreground">
                  {pifes === 1 ? 'pife' : 'pifes'}
                </p>
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
        <Button type="button" disabled={finished} onClick={() => setRoundOpen(true)}>
          <Plus />
          Registrar pife
        </Button>
      </div>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pife ainda.</p>
          ) : (
            <ol className="space-y-1.5">
              {recent.map((round, index) => {
                const winner = session.players.find((player) => player.id === round.winnerPlayerId)
                const number = state.rounds.length - index
                return (
                  <li
                    key={round.id}
                    className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 text-xs"
                  >
                    <p className="min-w-0 flex-1 font-medium">Mão {number}</p>
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary/10 px-2 py-1 font-semibold">
                      <Trophy className="size-3 text-primary" />
                      {winner?.name ?? '—'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label={`Desfazer pife de ${winner?.name ?? 'jogador'}`}
                      onClick={() => undoRound(sessionId, round.id)}
                    >
                      <RotateCcw />
                    </Button>
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
            <DrawerDescription>Alvo de pifes e quem dá as cartas.</DrawerDescription>
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
                  Mão
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{roundNumber}</p>
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
                    {session.players.map((player) => (
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

            <div>
              <Label htmlFor="target">Alvo (pifes)</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PIFE_TARGETS.map((target) => (
                  <Button
                    key={target}
                    type="button"
                    size="sm"
                    variant={state.targetScore === target && targetDraft === undefined ? 'default' : 'outline'}
                    disabled={finished}
                    onClick={() => {
                      setTargetDraft(undefined)
                      setTargetScore(sessionId, target)
                    }}
                  >
                    {target}
                  </Button>
                ))}
              </div>
              <Input
                id="target"
                className="mt-2"
                inputMode="numeric"
                disabled={finished}
                value={targetDraft ?? String(state.targetScore)}
                onChange={(e) => setTargetDraft(e.target.value)}
                onBlur={commitTarget}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  }
                }}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Quem chegar a {state.targetScore} {state.targetScore === 1 ? 'pife' : 'pifes'} fecha.
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => setMesaOpen(false)}>
              Fechar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={roundOpen} onOpenChange={setRoundOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Registrar pife</DrawerTitle>
            <DrawerDescription>Quem bateu nesta mão?</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 px-4 pb-2 sm:grid-cols-2">
            {session.players.map((player) => (
              <Button
                key={player.id}
                type="button"
                variant="outline"
                className="h-12 justify-start"
                disabled={finished}
                onClick={() => handleRegister(player.id)}
              >
                <span className="truncate">{player.name}</span>
              </Button>
            ))}
          </div>
          <DrawerFooter>
            <Button type="button" variant="ghost" onClick={() => setRoundOpen(false)}>
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
