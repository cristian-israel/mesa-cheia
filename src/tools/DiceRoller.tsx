import { useMemo, useState } from 'react'
import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DiceConfigSchema = z.object({
  sides: z.number().int().min(2),
  quantity: z.number().int().min(1).max(40),
})

type DiceConfig = z.infer<typeof DiceConfigSchema>

const PRESETS: Array<DiceConfig & { label: string }> = [
  { label: 'd4', sides: 4, quantity: 1 },
  { label: 'd6', sides: 6, quantity: 1 },
  { label: 'd20', sides: 20, quantity: 1 },
  { label: 'd100', sides: 100, quantity: 1 },
]

type DiceHistoryState = {
  recent: DiceConfig[]
  remember: (config: DiceConfig) => void
}

const useDiceHistory = create<DiceHistoryState>()(
  persist(
    (set, get) => ({
      recent: [],
      remember: (config) => {
        const key = `${config.sides}x${config.quantity}`
        const rest = get().recent.filter((item) => `${item.sides}x${item.quantity}` !== key)
        set({ recent: [config, ...rest].slice(0, 6) })
      },
    }),
    { name: 'pontos-dice', version: 1 },
  ),
)

function rollDice(config: DiceConfig) {
  return Array.from({ length: config.quantity }, () => 1 + Math.floor(Math.random() * config.sides))
}

export function DiceRoller() {
  const [sides, setSides] = useState('6')
  const [quantity, setQuantity] = useState('1')
  const [results, setResults] = useState<number[]>([])
  const recent = useDiceHistory((s) => s.recent)
  const remember = useDiceHistory((s) => s.remember)

  const parsed = useMemo(() => {
    const result = DiceConfigSchema.safeParse({
      sides: Number(sides),
      quantity: Number(quantity),
    })
    return result.success ? result.data : null
  }, [quantity, sides])

  function apply(config: DiceConfig) {
    setSides(String(config.sides))
    setQuantity(String(config.quantity))
  }

  function roll() {
    if (!parsed) {
      toast.message('Lados ≥ 2 e quantidade entre 1 e 40.')
      return
    }
    const next = rollDice(parsed)
    setResults(next)
    remember(parsed)
    toast.success(
      next.length === 1 ? `Deu ${next[0]}` : `${next.join(' + ')} = ${next.reduce((a, b) => a + b, 0)}`,
    )
  }

  const total = results.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="sides">Lados</Label>
          <Input
            id="sides"
            className="mt-1.5"
            inputMode="numeric"
            value={sides}
            onChange={(e) => setSides(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="qty">Quantidade</Label>
          <Input
            id="qty"
            className="mt-1.5"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => apply(preset)}
            className={cn(
              'rounded-md border bg-card/90 px-2 py-1 text-xs font-medium',
              parsed?.sides === preset.sides && parsed.quantity === preset.quantity
                ? 'border-primary'
                : '',
            )}
          >
            {preset.label}
          </button>
        ))}
        {recent.map((item) => (
          <button
            key={`${item.sides}x${item.quantity}`}
            type="button"
            onClick={() => apply(item)}
            className="rounded-md border bg-card/90 px-2 py-1 text-xs"
          >
            {item.quantity}d{item.sides}
          </button>
        ))}
      </div>

      <Button type="button" className="w-full" onClick={roll} disabled={!parsed}>
        Rolar
      </Button>

      {results.length > 0 ? (
        <div className="rounded-xl border bg-card/90 p-3">
          <p className="text-xs text-muted-foreground">Resultado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{total}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {results.map((value, index) => (
              <Badge key={`${value}-${index}`} variant="secondary">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
