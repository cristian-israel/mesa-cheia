import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { playRouletteLand, playRouletteSpin, ROULETTE_SPIN_S } from '@/lib/roulette-audio'
import { cn } from '@/lib/utils'

const SIZE = 200
const CX = 100
const CY = 100
const RADIUS = 94

export type RouletteProps = {
  items: string[]
  onResult?: (winner: string) => void
  allowEdit?: boolean
}

function polar(radius: number, angleDeg: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)] as const
}

function slicePath(index: number, count: number) {
  const sweep = 360 / count
  const start = index * sweep
  const end = start + sweep
  const [x0, y0] = polar(RADIUS, start)
  const [x1, y1] = polar(RADIUS, end)
  const large = sweep > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x1} ${y1} Z`
}

function sliceFill(index: number, count: number) {
  if (count % 2 === 1 && index === count - 1) {
    return 'color-mix(in oklch, var(--foreground) 6%, var(--background))'
  }
  return index % 2 === 0
    ? 'color-mix(in oklch, var(--foreground) 10%, var(--background))'
    : 'color-mix(in oklch, var(--foreground) 3%, var(--background))'
}

export function Roulette({ items, onResult, allowEdit = false }: RouletteProps) {
  const [list, setList] = useState(() => items.map((item) => item.trim()).filter(Boolean))
  const [draft, setDraft] = useState('')
  const [rotation, setRotation] = useState(0)
  const [busy, setBusy] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState<number>()
  const pending = useRef<{ index: number; name: string } | null>(null)

  const names = allowEdit ? list : items.map((item) => item.trim()).filter(Boolean)
  const slice = names.length > 0 ? 360 / names.length : 360
  const fontSize = names.length > 10 ? 7.5 : names.length > 6 ? 9 : 11
  const labelR = names.length > 8 ? 66 : 58

  const slices = useMemo(
    () =>
      names.map((name, index) => {
        const mid = index * slice + slice / 2
        const [lx, ly] = polar(labelR, mid)
        const upside = mid > 90 && mid < 270
        return { name, index, mid, lx, ly, upside }
      }),
    [labelR, names, slice],
  )

  const winner = winnerIndex !== undefined ? names[winnerIndex] : undefined

  function addItem() {
    const value = draft.trim()
    if (!value) return
    setList((current) => [...current, value])
    setDraft('')
    setWinnerIndex(undefined)
  }

  function removeItem(index: number) {
    setList((current) => current.filter((_, i) => i !== index))
    setWinnerIndex(undefined)
  }

  function spin() {
    if (busy || names.length < 2) return
    const index = Math.floor(Math.random() * names.length)
    const target = (360 - (index * slice + slice / 2) + 360) % 360
    const current = ((rotation % 360) + 360) % 360
    const delta = (target - current + 360) % 360
    pending.current = { index, name: names[index] }
    setBusy(true)
    setWinnerIndex(undefined)
    setRotation((value) => value + 360 * 6 + delta)
    void playRouletteSpin()
  }

  function settle() {
    const result = pending.current
    if (!result) return
    pending.current = null
    setWinnerIndex(result.index)
    onResult?.(result.name)
    toast.success(`Sorteado: ${result.name}`)
    setBusy(false)
    void playRouletteLand()
  }

  return (
    <div className="space-y-4">
      {allowEdit ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={draft}
              placeholder="Um nome por vez"
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Adicionar"
              disabled={busy || !draft.trim()}
              onClick={addItem}
            >
              <Plus />
            </Button>
          </div>
          {list.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {list.map((name, index) => (
                <button
                  key={`${name}-${index}`}
                  type="button"
                  disabled={busy}
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                >
                  {name}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Adicione pelo menos dois nomes.</p>
          )}
        </div>
      ) : null}

      <div className="relative mx-auto w-full max-w-[20rem]">
        <div className="pointer-events-none absolute inset-[6%] rounded-full bg-foreground/8 blur-xl" />

        <svg
          viewBox="0 0 24 22"
          className="pointer-events-none absolute left-1/2 top-0 z-20 w-6 -translate-x-1/2 -translate-y-0.5"
          aria-hidden
        >
          <path d="M12 1.5 L20 18 H4 Z" className="fill-foreground" />
          <path d="M12 5.5 L16.5 16 H7.5 Z" className="fill-background/40" />
        </svg>

        <button
          type="button"
          aria-label="Girar roleta"
          disabled={busy || names.length < 2}
          onClick={spin}
          className="relative block w-full disabled:opacity-70"
        >
          <motion.div
            className="aspect-square w-full will-change-transform"
            initial={false}
            animate={{ rotate: rotation }}
            transition={{ duration: ROULETTE_SPIN_S, ease: [0.12, 0.78, 0.08, 1] }}
            onAnimationComplete={settle}
          >
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full">
              <circle cx={CX} cy={CY} r={RADIUS + 4} className="fill-background stroke-border" strokeWidth="4" />
              {slices.length === 0 ? (
                <circle cx={CX} cy={CY} r={RADIUS} className="fill-muted" />
              ) : (
                slices.map((item) => {
                  const active = winnerIndex === item.index && !busy
                  return (
                    <path
                      key={`slice-${item.index}`}
                      d={slicePath(item.index, names.length)}
                      className={cn(active ? 'fill-primary/25 stroke-primary/50' : 'stroke-border/80')}
                      style={active ? undefined : { fill: sliceFill(item.index, names.length) }}
                      strokeWidth="0.6"
                    />
                  )
                })
              )}
              {slices.map((item) => {
                const [x0, y0] = polar(RADIUS - 8, item.index * slice)
                const [x1, y1] = polar(RADIUS, item.index * slice)
                return (
                  <line
                    key={`tick-${item.index}`}
                    x1={x0}
                    y1={y0}
                    x2={x1}
                    y2={y1}
                    className="stroke-foreground/25"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                )
              })}
              {slices.map((item) => (
                <text
                  key={`label-${item.index}`}
                  x={item.lx}
                  y={item.ly}
                  fontSize={fontSize}
                  fontWeight={winnerIndex === item.index && !busy ? 700 : 600}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${item.mid + (item.upside ? 180 : 0)} ${item.lx} ${item.ly})`}
                  className={cn(
                    'pointer-events-none select-none',
                    winnerIndex === item.index && !busy ? 'fill-foreground' : 'fill-muted-foreground',
                  )}
                >
                  {item.name.length > 14 ? `${item.name.slice(0, 13)}…` : item.name}
                </text>
              ))}
              <circle cx={CX} cy={CY} r={20} className="fill-background stroke-border" strokeWidth="1.5" />
              <circle cx={CX} cy={CY} r={11} className="fill-muted/80 stroke-border/80" strokeWidth="0.8" />
              <circle cx={CX} cy={CY} r={3.5} className="fill-foreground/70" />
            </svg>
          </motion.div>
        </button>
      </div>

      <p className="min-h-5 text-center text-sm font-medium">
        {busy
          ? 'Girando…'
          : winner
            ? `Sorteado: ${winner}`
            : names.length < 2
              ? 'Precisa de 2+ itens'
              : 'Toque na roleta'}
      </p>

      <Button type="button" className="w-full" onClick={spin} disabled={busy || names.length < 2}>
        {busy ? 'Girando…' : 'Girar'}
      </Button>
    </div>
  )
}
