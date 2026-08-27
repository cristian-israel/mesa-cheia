import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Dices, Minus, Plus, RotateCcw, Settings2, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  TRUCO_SHORTCUTS,
  TRUCO_TARGETS,
  faltaDelta,
  teamTotals,
} from '@/games/truco/schema'
import { useTrucoStore } from '@/games/truco/store'
import { scoringSides } from '@/lib/teams'
import { formatDuration, formatWhen, sessionDurationMs } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

type PendingShortcut = {
  label: string
  delta?: number
  falta?: boolean
}

export function TrucoScreen({ sessionId }: { sessionId: string }) {
  const session = useSessionStore((s) => s.sessions[sessionId])
  const state = useTrucoStore((s) => s.sessions[sessionId])
  const applyDelta = useTrucoStore((s) => s.applyDelta)
  const nextDealer = useTrucoStore((s) => s.nextDealer)
  const setDealer = useTrucoStore((s) => s.setDealer)
  const setTargetScore = useTrucoStore((s) => s.setTargetScore)
  const undoEvent = useTrucoStore((s) => s.undoEvent)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mesaOpen, setMesaOpen] = useState(false)
  const [remove, setRemove] = useState(false)
  const [pending, setPending] = useState<PendingShortcut>()
  const [targetDraft, setTargetDraft] = useState<string>()

  if (!session || !state) {
    return (
      <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">Estado do Truco não encontrado.</p>
        <Button asChild className="mt-3">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    )
  }

  const finished = session.status === 'finished'
  const sides = scoringSides(session)
  const totals = teamTotals(state)
  const dealer = session.players.find((p) => p.id === state.dealerPlayerId)
  const playerNames = session.players.map((p) => p.name)
  const sign = remove ? -1 : 1
  const half = Math.floor(state.targetScore / 2)
  const recent = [...state.events].reverse()
  const scoreValues = sides.map((side) => totals[side.id] ?? 0)
  const maxScore = Math.max(0, ...scoreValues)
  const scoresTied = scoreValues.length > 1 && scoreValues.every((score) => score === maxScore)
  const anyFalta = sides.some((side) => faltaDelta(state.targetScore, totals[side.id] ?? 0) > 0)

  function deltaFor(sideId: string) {
    if (!pending) return 0
    if (pending.falta) return faltaDelta(state.targetScore, totals[sideId] ?? 0)
    return pending.delta ?? 0
  }

  function assignTo(sideId: string) {
    const delta = deltaFor(sideId)
    if (!pending || delta === 0) return
    applyDelta(sessionId, sideId, delta * sign, pending.label)
    setPending(undefined)
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
          <h1 className="text-xl font-bold tracking-tight">Truco gaúcho</h1>
          <p className="truncate text-xs text-muted-foreground">
            {finished
              ? 'Partida encerrada'
              : `Até ${state.targetScore} · ${dealer?.name ?? '—'} dá as cartas`}
          </p>
        </div>
        {finished ? <Badge>Fim</Badge> : null}
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

      <div className={cn('grid gap-3', sides.length > 1 && 'grid-cols-2')}>
        {sides.map((side) => {
          const members = side.playerIds
            .map((id) => session.players.find((p) => p.id === id)?.name)
            .filter(Boolean)
            .join(' · ')
          const score = totals[side.id] ?? 0
          const closed = score >= state.targetScore
          const malas = !closed && state.targetScore >= 24 && score >= half
          const leading = !closed && maxScore > 0 && !scoresTied && score === maxScore
          return (
            <Card
              key={side.id}
              className={cn(
                'bg-card/90',
                leading && 'bg-primary/10 ring-2 ring-primary/30',
                closed && 'border-primary bg-primary/10 ring-2 ring-primary/50',
              )}
            >
              <CardHeader className="pb-1">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-1.5">
                      {leading || closed ? (
                        <Trophy className="size-4 shrink-0 text-primary" />
                      ) : null}
                      <span className="truncate">{side.name}</span>
                    </CardTitle>
                    {side.playerIds.length > 1 ? (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{members}</p>
                    ) : null}
                  </div>
                  {closed ? <Badge>Fechou</Badge> : null}
                  {malas ? <Badge variant="secondary">Más</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-center text-4xl font-bold tabular-nums leading-none sm:text-5xl">
                  {score}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    aria-label={`Tirar 1 de ${side.name}`}
                    onClick={() => applyDelta(sessionId, side.id, -1, 'Ajuste')}
                  >
                    <Minus />
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    aria-label={`Somar 1 para ${side.name}`}
                    onClick={() => applyDelta(sessionId, side.id, 1, 'Ajuste')}
                  >
                    <Plus />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Atalhos</CardTitle>
            <div className="flex rounded-lg border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={remove ? 'ghost' : 'secondary'}
                className="h-7 px-2.5"
                onClick={() => setRemove(false)}
              >
                Somar
              </Button>
              <Button
                type="button"
                size="sm"
                variant={remove ? 'secondary' : 'ghost'}
                className="h-7 px-2.5"
                onClick={() => setRemove(true)}
              >
                Tirar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Toque no tento e escolha quem leva.
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {TRUCO_SHORTCUTS.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-11 flex-col gap-0 px-2"
                onClick={() => setPending({ label: item.label, delta: item.delta })}
              >
                <span className="text-xs font-semibold">{item.label}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {remove ? '−' : '+'}
                  {item.delta}
                </span>
              </Button>
            ))}
            {anyFalta ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 flex-col gap-0 px-2 sm:col-span-2"
                onClick={() => setPending({ label: 'Falta', falta: true })}
              >
                <span className="text-xs font-semibold">Falta</span>
                <span className="text-[11px] text-muted-foreground">resto até o alvo</span>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum tento ainda. Toque num atalho.</p>
          ) : (
            <ol className="space-y-1.5">
              {recent.map((event) => {
                const side = sides.find((item) => item.id === event.sideId)
                return (
                  <li
                    key={event.id}
                    className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 text-xs"
                  >
                    <p className="min-w-0 flex-1 truncate font-medium">
                      {side?.name ?? '—'} · {event.label}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 tabular-nums font-semibold',
                        event.delta < 0 ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      {event.delta > 0 ? '+' : ''}
                      {event.delta}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label={`Desfazer ${event.label} de ${side?.name ?? 'lado'}`}
                      onClick={() => undoEvent(sessionId, event.id)}
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

      <Drawer open={Boolean(pending)} onOpenChange={(open) => !open && setPending(undefined)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{pending?.label ?? 'Tento'}</DrawerTitle>
            <DrawerDescription>
              {remove ? 'De quem tirar estes tentos?' : 'Quem leva estes tentos?'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 px-4 pb-2 sm:grid-cols-2">
            {sides.map((side) => {
              const delta = deltaFor(side.id)
              const shown = delta * sign
              return (
                <Button
                  key={side.id}
                  type="button"
                  variant="outline"
                  className="h-12 justify-between"
                  disabled={delta === 0}
                  onClick={() => assignTo(side.id)}
                >
                  <span className="truncate">{side.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {shown > 0 ? '+' : ''}
                    {shown}
                  </span>
                </Button>
              )
            })}
          </div>
          <DrawerFooter>
            <Button type="button" variant="ghost" onClick={() => setPending(undefined)}>
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={mesaOpen} onOpenChange={setMesaOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mesa</DrawerTitle>
            <DrawerDescription>Alvo da partida e quem dá as cartas.</DrawerDescription>
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
              <Label htmlFor="target">Alvo (tentos)</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {TRUCO_TARGETS.map((target) => (
                  <Button
                    key={target}
                    type="button"
                    variant={state.targetScore === target && targetDraft === undefined ? 'default' : 'outline'}
                    onClick={() => {
                      setTargetScore(sessionId, target)
                      setTargetDraft(undefined)
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
                value={targetDraft ?? String(state.targetScore)}
                onChange={(e) => setTargetDraft(e.target.value)}
                onBlur={commitTarget}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="dealer">Dá as cartas</Label>
              <div className="mt-1.5 flex gap-2">
                <select
                  id="dealer"
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
                <Button type="button" variant="outline" onClick={() => nextDealer(sessionId)}>
                  Próximo
                  <ChevronRight />
                </Button>
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
