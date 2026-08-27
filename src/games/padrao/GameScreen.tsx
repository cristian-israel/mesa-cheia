import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Dices, Minus, Plus, RotateCcw, Settings2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
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
import { PADRAO_TARGETS, sideTotals } from '@/games/padrao/schema'
import { usePadraoStore } from '@/games/padrao/store'
import { scoringSides } from '@/lib/teams'
import { formatDuration, formatWhen, sessionDurationMs } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

function formatPoints(value: number) {
  return value.toLocaleString('pt-BR')
}

export function PadraoScreen({ sessionId }: { sessionId: string }) {
  const session = useSessionStore((s) => s.sessions[sessionId])
  const state = usePadraoStore((s) => s.sessions[sessionId])
  const applyDelta = usePadraoStore((s) => s.applyDelta)
  const nextDealer = usePadraoStore((s) => s.nextDealer)
  const setDealer = usePadraoStore((s) => s.setDealer)
  const setTargetScore = usePadraoStore((s) => s.setTargetScore)
  const undoEvent = usePadraoStore((s) => s.undoEvent)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mesaOpen, setMesaOpen] = useState(false)
  const [roundOpen, setRoundOpen] = useState(false)
  const [scores, setScores] = useState<Record<string, string>>({})
  const [targetDraft, setTargetDraft] = useState<string>()

  if (!session || !state) {
    return (
      <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">Estado do Padrão não encontrado.</p>
        <Button asChild className="mt-3">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    )
  }

  const finished = session.status === 'finished'
  const sides = scoringSides(session)
  const totals = sideTotals(state)
  const dealer = session.players.find((p) => p.id === state.dealerPlayerId)
  const playerNames = session.players.map((p) => p.name)
  const scoreValues = sides.map((side) => totals[side.id] ?? 0)
  const maxScore = Math.max(0, ...scoreValues)
  const scoresTied = scoreValues.length > 1 && scoreValues.every((score) => score === maxScore)
  const recent = [...state.events].reverse()

  function openRound() {
    setScores({})
    setRoundOpen(true)
  }

  function handleRegister() {
    if (finished) return
    let launched = 0
    for (const side of sides) {
      const raw = scores[side.id]?.trim() ?? ''
      const value = raw === '' ? 0 : Number(raw)
      if (!Number.isInteger(value)) {
        toast.message('Pontos precisam ser números inteiros.')
        return
      }
      if (value !== 0) {
        applyDelta(sessionId, side.id, value, 'Rodada')
        launched += 1
      }
    }
    if (launched === 0) {
      toast.message('Informe os pontos de pelo menos um lado.')
      return
    }
    nextDealer(sessionId)
    setRoundOpen(false)
    toast.success('Pontos lançados.')
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
          <h1 className="text-xl font-bold tracking-tight">Padrão</h1>
          <p className="truncate text-xs text-muted-foreground">
            {finished
              ? 'Partida encerrada'
              : `Até ${formatPoints(state.targetScore)} · ${dealer?.name ?? '—'} dá as cartas`}
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
          const leading = !closed && maxScore > 0 && !scoresTied && score === maxScore
          return (
            <Card
              key={side.id}
              className={cn(
                'bg-card/90',
                leading && 'border-primary bg-primary/10 ring-2 ring-primary/30',
                closed && 'border-primary bg-primary/10 ring-2 ring-primary/50',
              )}
            >
              <CardHeader className="pb-1">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-1.5">
                      {leading || closed ? <Trophy className="size-4 shrink-0 text-primary" /> : null}
                      <span className="truncate">{side.name}</span>
                    </CardTitle>
                    {side.playerIds.length > 1 ? (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{members}</p>
                    ) : null}
                  </div>
                  {closed ? <Badge>Fechou</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-center text-4xl font-bold tabular-nums leading-none sm:text-5xl">
                  {formatPoints(score)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={finished}
                    aria-label={`Tirar 1 de ${side.name}`}
                    onClick={() => applyDelta(sessionId, side.id, -1, 'Ajuste')}
                  >
                    <Minus />
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    disabled={finished}
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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => setMesaOpen(true)}>
          <Settings2 />
          Mesa
        </Button>
        <Button type="button" disabled={finished} onClick={openRound}>
          <Plus />
          Lançar pontos
        </Button>
      </div>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ponto ainda.</p>
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
                      {formatPoints(event.delta)}
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

            <div>
              <Label htmlFor="target">Alvo</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PADRAO_TARGETS.map((target) => (
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
                    {formatPoints(target)}
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
                Quem chegar a {formatPoints(state.targetScore)} fecha.
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
            <DrawerTitle>Lançar pontos</DrawerTitle>
            <DrawerDescription>Quanto cada um fez nesta rodada.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {sides.map((side) => (
                <div key={side.id}>
                  <Label htmlFor={`score-${side.id}`}>{side.name}</Label>
                  <Input
                    id={`score-${side.id}`}
                    className="mt-1.5"
                    inputMode="numeric"
                    placeholder="0"
                    disabled={finished}
                    value={scores[side.id] ?? ''}
                    onChange={(e) =>
                      setScores((current) => ({ ...current, [side.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <DrawerFooter>
            <Button type="button" disabled={finished} onClick={handleRegister}>
              Lançar
            </Button>
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
