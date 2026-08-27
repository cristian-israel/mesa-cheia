import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export type RouletteProps = {
  items: string[]
  onResult?: (winner: string) => void
  allowEdit?: boolean
}

export function Roulette({ items, onResult, allowEdit = false }: RouletteProps) {
  const [draft, setDraft] = useState(items.join('\n'))
  const [rotation, setRotation] = useState(0)
  const [busy, setBusy] = useState(false)
  const [winner, setWinner] = useState<string>()

  const names = useMemo(() => {
    const source = allowEdit ? draft.split('\n') : items
    return source.map((s) => s.trim()).filter(Boolean)
  }, [allowEdit, draft, items])

  const slice = names.length > 0 ? 360 / names.length : 360
  const gradient = names
    .map((_, index) => {
      const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--muted)']
      const color = colors[index % colors.length]
      const start = index * slice
      const end = start + slice
      return `${color} ${start}deg ${end}deg`
    })
    .join(', ')

  function spin() {
    if (busy || names.length < 2) return
    setBusy(true)
    const index = Math.floor(Math.random() * names.length)
    const picked = names[index]
    const center = index * slice + slice / 2
    const next = rotation + 360 * 5 + (360 - center)
    setRotation(next)
    window.setTimeout(() => {
      setWinner(picked)
      onResult?.(picked)
      toast.success(`Sorteado: ${picked}`)
      setBusy(false)
    }, 1800)
  }

  return (
    <div className="space-y-4">
      {allowEdit ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder={'Um nome por linha'}
          className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-sm"
        />
      ) : null}

      <div className="relative mx-auto size-56">
        <div className="absolute left-1/2 top-0 z-10 h-4 w-3 -translate-x-1/2 rounded-b-sm bg-foreground" />
        <motion.div
          className="size-56 rounded-full border shadow-inner"
          style={{
            background:
              names.length > 0 ? `conic-gradient(from -90deg, ${gradient})` : 'var(--muted)',
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        />
        <div className="pointer-events-none absolute inset-8 grid place-items-center rounded-full bg-background/85 text-center text-xs font-medium">
          {winner ?? (names.length < 2 ? 'Precisa de 2+ itens' : 'Sortear')}
        </div>
      </div>

      {names.length > 0 ? (
        <p className="text-center text-[11px] text-muted-foreground">{names.join(' · ')}</p>
      ) : null}

      <Button type="button" className="w-full" onClick={spin} disabled={busy || names.length < 2}>
        {busy ? 'Girando…' : 'Girar'}
      </Button>
    </div>
  )
}
