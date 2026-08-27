import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  CYLINDER_SPIN_S,
  playBang,
  playCylinderSpin,
  playDryFire,
} from '@/lib/revolver-audio'
import { cn } from '@/lib/utils'

const CHAMBERS = 6
const CHAMBER_STEP = 360 / CHAMBERS

function loadCylinder(bullets: number) {
  const live = new Set<number>()
  while (live.size < bullets) live.add(Math.floor(Math.random() * CHAMBERS))
  return Array.from({ length: CHAMBERS }, (_, index) => live.has(index))
}

function chamberPoint(index: number, radius: number) {
  const angle = ((index * CHAMBER_STEP - 90) * Math.PI) / 180
  return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const
}

export function RussianRoulette() {
  const [bullets, setBullets] = useState(1)
  const [loaded, setLoaded] = useState<boolean[]>()
  const [index, setIndex] = useState(0)
  const [spins, setSpins] = useState(0)
  const [busy, setBusy] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [hammer, setHammer] = useState<'cocked' | 'down'>('cocked')
  const [flash, setFlash] = useState(false)
  const [recoil, setRecoil] = useState(false)
  const [result, setResult] = useState<'click' | 'bang'>()

  const ready = Boolean(loaded) && result !== 'bang' && !busy
  const remaining = loaded ? CHAMBERS - index : CHAMBERS
  const liveLeft = loaded ? loaded.slice(index).filter(Boolean).length : bullets

  function spin() {
    if (busy) return
    const next = loadCylinder(bullets)
    setLoaded(next)
    setIndex(0)
    setResult(undefined)
    setHammer('cocked')
    setFlash(false)
    setRecoil(false)
    setSpins((value) => value + 5)
    setBusy(true)
    setSpinning(true)
    void playCylinderSpin()
    window.setTimeout(() => {
      setSpinning(false)
      setBusy(false)
    }, CYLINDER_SPIN_S * 1000)
  }

  function pull() {
    if (!ready || !loaded) return
    const hit = loaded[index]
    setBusy(true)
    setHammer('down')
    if (hit) {
      setFlash(true)
      setRecoil(true)
      setResult('bang')
      void playBang()
      toast.error('Bala.')
      window.setTimeout(() => {
        setFlash(false)
        setRecoil(false)
        setBusy(false)
      }, 420)
      return
    }
    void playDryFire()
    toast.message('Clique.')
    setResult('click')
    window.setTimeout(() => {
      setIndex((value) => value + 1)
      setHammer('cocked')
      setBusy(false)
    }, 280)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-medium text-muted-foreground">Balas no tambor</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[1, 2, 3, 4].map((count) => (
            <Button
              key={count}
              type="button"
              size="sm"
              variant={bullets === count ? 'default' : 'outline'}
              disabled={busy}
              onClick={() => {
                setBullets(count)
                setLoaded(undefined)
                setIndex(0)
                setResult(undefined)
                setHammer('cocked')
              }}
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-88">
        <button
          type="button"
          aria-label={ready ? 'Puxar gatilho' : 'Girar tambor'}
          disabled={busy}
          onClick={() => (ready ? pull() : spin())}
          className="block w-full disabled:opacity-80"
        >
        <motion.div
          className="w-full"
          animate={{ x: recoil ? [-10, 6, -2, 0] : 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <svg viewBox="0 0 300 168" className="w-full text-foreground">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 214 78 C 208 96 198 128 186 148 C 204 146 228 124 236 92 L 222 72 Z"
                className="fill-foreground/90 stroke-foreground"
                strokeWidth="1.6"
              />
              <path
                d="M 214 78 C 210 92 204 118 198 136"
                className="stroke-background/40"
                strokeWidth="2"
              />
              <path
                d="M 12 52 H 128 V 74 H 12 Z"
                className="fill-foreground/85 stroke-foreground"
                strokeWidth="1.6"
              />
              <path d="M 12 52 H 128" className="stroke-background/25" strokeWidth="6" />
              <rect x="22" y="42" width="8" height="11" rx="1.2" className="fill-foreground" />
              <circle cx="18" cy="63" r="3.2" className="fill-foreground/70" />
              <path
                d="M 128 48 H 198 C 210 48 218 54 220 64 V 86 C 210 94 188 96 168 92 V 48 Z"
                className="fill-foreground/80 stroke-foreground"
                strokeWidth="1.6"
              />
              <g transform="translate(156 68)">
                <motion.g
                  animate={{ rotate: spins * 360 + index * CHAMBER_STEP }}
                  transition={{
                    duration: spinning ? CYLINDER_SPIN_S : 0.2,
                    ease: [0.12, 0.78, 0.08, 1],
                  }}
                >
                  <circle r="34" className="fill-foreground/90 stroke-foreground" strokeWidth="1.8" />
                  <circle r="8" className="fill-background/50 stroke-foreground/40" strokeWidth="1.2" />
                  {Array.from({ length: CHAMBERS }, (_, chamber) => {
                    const [x, y] = chamberPoint(chamber, 20)
                    const spent = loaded ? chamber < index : false
                    return (
                      <circle
                        key={chamber}
                        cx={x}
                        cy={y}
                        r="7.2"
                        className={cn(
                          spent ? 'fill-background/80 stroke-foreground/30' : 'fill-background/35 stroke-foreground/50',
                        )}
                        strokeWidth="1.2"
                      />
                    )
                  })}
                </motion.g>
                <path d="M 0 -38 L -5 -46 H 5 Z" className="fill-foreground" />
              </g>
              <motion.g
                style={{ transformOrigin: '226px 52px' }}
                animate={{ rotate: hammer === 'down' ? 28 : -32 }}
                transition={{ duration: 0.08, ease: 'easeIn' }}
              >
                <path
                  d="M 218 54 L 238 38 L 244 42 L 226 62 Z"
                  className="fill-foreground stroke-foreground"
                  strokeWidth="1.2"
                />
              </motion.g>
              <path
                d="M 198 86 C 198 104 208 112 222 112 C 234 112 238 102 236 90"
                className="stroke-foreground/80"
                strokeWidth="2"
              />
              <path d="M 218 86 L 216 104" className="stroke-foreground" strokeWidth="2.4" />
              {flash ? (
                <g>
                  <ellipse cx="8" cy="63" rx="18" ry="10" className="fill-foreground/80" />
                  <ellipse cx="2" cy="63" rx="10" ry="5" className="fill-background" />
                </g>
              ) : null}
            </g>
          </svg>
        </motion.div>
        </button>
      </div>

      <p className="min-h-5 text-center text-sm font-medium">
        {busy && spinning
          ? 'Girando o tambor…'
          : result === 'bang'
            ? 'Bala. Gire de novo para recarregar.'
            : result === 'click'
              ? `Clique. ${liveLeft} em ${remaining}`
              : loaded
                ? `${liveLeft} em ${remaining} · toque no gatilho`
                : 'Gire o tambor'}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={spin}>
          Girar tambor
        </Button>
        <Button type="button" disabled={!ready} onClick={pull}>
          Puxar gatilho
        </Button>
      </div>
    </div>
  )
}
