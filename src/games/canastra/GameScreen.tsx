import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Dices, Plus, RotateCcw, Settings2, Trophy } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { ToolsDrawer } from '@/components/tools/ToolsDrawer'
import { buracoThreshold, isNoBuraco, teamTotals } from '@/games/canastra/schema'
import { useCanastraStore } from '@/games/canastra/store'
import { scoringSides } from '@/lib/teams'
import { formatDuration, formatWhen, sessionDurationMs } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

function formatPoints(value: number) {
  return value.toLocaleString('pt-BR')
}

function roundLeaders(teamScores: Record<string, number>, sideIds: string[]) {
  const scores = sideIds.map((id) => teamScores[id] ?? 0)
  const max = Math.max(...scores)
  if (scores.every((score) => score === max)) return new Set<string>()
  return new Set(sideIds.filter((id) => (teamScores[id] ?? 0) === max))
}

export function CanastraScreen({ sessionId }: { sessionId: string }) {
  const session = useSessionStore((s) => s.sessions[sessionId])
  const state = useCanastraStore((s) => s.sessions[sessionId])
  const registerRound = useCanastraStore((s) => s.registerRound)
  const nextDealer = useCanastraStore((s) => s.nextDealer)
  const setDealer = useCanastraStore((s) => s.setDealer)
  const setTargetScore = useCanastraStore((s) => s.setTargetScore)
  const setBuracoEnabled = useCanastraStore((s) => s.setBuracoEnabled)
  const setBuracoScore = useCanastraStore((s) => s.setBuracoScore)
  const undoLastRound = useCanastraStore((s) => s.undoLastRound)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mesaOpen, setMesaOpen] = useState(false)
  const [roundOpen, setRoundOpen] = useState(false)
  const [scores, setScores] = useState<Record<string, string>>({})
  const [winnerTeamId, setWinnerTeamId] = useState<string>('')
  const [targetDraft, setTargetDraft] = useState<string>()
  const [buracoDraft, setBuracoDraft] = useState<string>()

  if (!session || !state) {
    return (
      <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">Estado da Canastra não encontrado.</p>
        <Button asChild className="mt-3">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    )
  }

  const sides = scoringSides(session)
  const totals = teamTotals(state)
  const finished = session.status === 'finished'
  const playerNames = session.players.map((p) => p.name)
  const roundNumber = state.rounds.length + 1
  const buracoOn = state.buracoEnabled ?? true
  const meta = buracoThreshold(state)
  const dealer = session.players.find((p) => p.id === state.dealerPlayerId)

  function handleRegister() {
    if (sides.length === 0) return
    const teamScores: Record<string, number> = {}
    for (const team of sides) {
      const raw = scores[team.id]?.trim() ?? ''
      const value = raw === '' ? 0 : Number(raw)
      if (!Number.isFinite(value)) {
        toast.message('Pontos precisam ser números.')
        return
      }
      teamScores[team.id] = value
    }
    registerRound(sessionId, teamScores, winnerTeamId || undefined)
    nextDealer(sessionId)
    setScores({})
    setWinnerTeamId('')
    setRoundOpen(false)
    toast.success('Rodada lançada.')
  }

  function commitNumber(raw: string | undefined, fallback: number, apply: (value: number) => void) {
    const value = Number(raw)
    if (!Number.isInteger(value) || value < 1) return
    if (value !== fallback) apply(value)
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
          <h1 className="text-xl font-bold tracking-tight">Canastra</h1>
          <p className="truncate text-xs text-muted-foreground">
            {finished
              ? 'Partida encerrada'
              : `Rodada ${roundNumber} · ${dealer?.name ?? '—'} dá as cartas`}
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

      <div className="grid gap-3 md:grid-cols-2">
        {sides.map((team) => {
          const members = team.playerIds
            .map((id) => session.players.find((p) => p.id === id)?.name)
            .filter(Boolean)
            .join(' · ')
          const total = totals[team.id] ?? 0
          const closed = total >= state.targetScore
          const inBuraco = !closed && isNoBuraco(state, total)
          return (
            <Card
              key={team.id}
              className={cn(
                'bg-card/90',
                inBuraco && 'ring-2 ring-primary/25',
                closed && 'ring-2 ring-primary/50',
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{team.name}</CardTitle>
                    {team.playerIds.length > 1 ? (
                      <p className="mt-1 text-xs text-muted-foreground">{members}</p>
                    ) : null}
                  </div>
                  {closed ? <Badge>Fechou</Badge> : null}
                  {inBuraco ? <Badge variant="secondary">No buraco</Badge> : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{formatPoints(total)}</p>
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
          Nova rodada
        </Button>
      </div>

      <Card className="mt-3 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {state.rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma rodada ainda.</p>
          ) : (
            <ol className="space-y-2">
              {state.rounds.map((round, index) => {
                const leaders = roundLeaders(
                  round.teamScores,
                  sides.map((side) => side.id),
                )
                return (
                  <li key={round.id} className="rounded-lg border bg-background/50 px-3 py-2 text-xs">
                    <p className="font-medium">Rodada {index + 1}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {sides.map((team) => {
                        const points = round.teamScores[team.id] ?? 0
                        const lead = leaders.has(team.id)
                        return (
                          <span
                            key={team.id}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border px-2 py-1 tabular-nums',
                              lead
                                ? 'border-primary bg-primary/10 font-semibold text-foreground'
                                : 'text-muted-foreground',
                            )}
                          >
                            {lead ? <Trophy className="size-3 text-primary" /> : null}
                            {team.name} {formatPoints(points)}
                          </span>
                        )
                      })}
                    </div>
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
              Rodada, quem dá as cartas, alvo e buraco desta partida.
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
                  Rodada
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

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/90 px-3 py-2">
              <div>
                <Label htmlFor="buraco">Buraco</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {buracoOn
                    ? `Meta ${formatPoints(meta)} — metade do alvo, se você não mudar.`
                    : 'Esta partida não usa buraco.'}
                </p>
              </div>
              <Switch
                id="buraco"
                checked={buracoOn}
                disabled={finished}
                onCheckedChange={(checked) => setBuracoEnabled(sessionId, checked)}
              />
            </div>

            <div className={cn('grid gap-3', buracoOn ? 'sm:grid-cols-2' : '')}>
              <div>
                <Label htmlFor="target">Alvo</Label>
                <Input
                  id="target"
                  className="mt-1.5"
                  inputMode="numeric"
                  value={targetDraft ?? String(state.targetScore)}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  onBlur={() => {
                    commitNumber(targetDraft, state.targetScore, (value) =>
                      setTargetScore(sessionId, value),
                    )
                    setTargetDraft(undefined)
                  }}
                  disabled={finished}
                />
              </div>
              {buracoOn ? (
                <div>
                  <Label htmlFor="meta">Meta (buraco)</Label>
                  <Input
                    id="meta"
                    className="mt-1.5"
                    inputMode="numeric"
                    value={buracoDraft ?? String(meta)}
                    onChange={(e) => setBuracoDraft(e.target.value)}
                    onBlur={() => {
                      commitNumber(buracoDraft, meta, (value) => setBuracoScore(sessionId, value))
                      setBuracoDraft(undefined)
                    }}
                    disabled={finished}
                  />
                </div>
              ) : null}
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
            <DrawerTitle>Nova rodada</DrawerTitle>
            <DrawerDescription>Lance os pontos desta mão.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {sides.map((team) => (
                <div key={team.id}>
                  <Label htmlFor={`score-${team.id}`}>{team.name}</Label>
                  <Input
                    id={`score-${team.id}`}
                    className="mt-1.5"
                    inputMode="numeric"
                    placeholder="0"
                    disabled={finished}
                    value={scores[team.id] ?? ''}
                    onChange={(e) =>
                      setScores((current) => ({ ...current, [team.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="winner">Quem bateu (opcional)</Label>
              <select
                id="winner"
                disabled={finished}
                value={winnerTeamId}
                onChange={(e) => setWinnerTeamId(e.target.value)}
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm shadow-sm"
              >
                <option value="">Ninguém / empate</option>
                {sides.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DrawerFooter>
            <Button type="button" disabled={finished} onClick={handleRegister}>
              Lançar rodada
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={state.rounds.length === 0}
              onClick={() => undoLastRound(sessionId)}
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
