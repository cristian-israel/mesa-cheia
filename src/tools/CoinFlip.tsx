import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Face = 'cara' | 'coroa'

export function CoinFlip() {
  const [face, setFace] = useState<Face>('cara')
  const [flips, setFlips] = useState(0)
  const [busy, setBusy] = useState(false)

  function toss() {
    if (busy) return
    setBusy(true)
    const next: Face = Math.random() < 0.5 ? 'cara' : 'coroa'
    setFlips((n) => n + 6)
    window.setTimeout(() => {
      setFace(next)
      toast.success(next === 'cara' ? 'Deu Cara!' : 'Deu Coroa!')
      setBusy(false)
    }, 700)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <motion.button
        type="button"
        aria-label="Girar moeda"
        onClick={toss}
        animate={{ rotateY: flips * 180 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        className="grid size-28 place-items-center rounded-full border bg-card text-2xl font-bold shadow-md"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {face === 'cara' ? 'Cara' : 'Coroa'}
      </motion.button>
      <Button type="button" onClick={toss} disabled={busy}>
        {busy ? 'Girando…' : 'Jogar moeda'}
      </Button>
    </div>
  )
}
