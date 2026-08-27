import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus, Settings2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { fileToCoinImage } from '@/lib/coin-image'
import { cn } from '@/lib/utils'
import { useCoinStore, type CoinSide } from '@/stores/coinStore'
import { COIN_PRESETS, matchingPresetId, type CoinSideId } from '@/tools/coin-presets'

const SPIN_MS = 2600
const COIN_SIZE = 160
const COIN_DEPTH = 14
const EDGE_SLICES = 20

function landingRotation(current: number, result: 0 | 1) {
  const spins = 8 + Math.floor(Math.random() * 5)
  const mod = ((current % 360) + 360) % 360
  const want = result * 180
  const extra = (want - mod + 360) % 360
  return current + spins * 360 + extra
}

function sideCaption(side: CoinSide, id: CoinSideId) {
  const label = side.label.trim()
  if (label) return label
  return id === 'a' ? 'Lado A' : 'Lado B'
}

function CoinFace({ side, flipped }: { side: CoinSide; flipped?: boolean }) {
  const label = side.label.trim()
  const depth = COIN_DEPTH / 2
  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden rounded-full',
        flipped ? 'bg-muted text-foreground' : 'bg-card text-foreground',
      )}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: `rotateY(${flipped ? 180 : 0}deg) translateZ(${depth}px)`,
        boxShadow: 'inset 0 0 0 2px color-mix(in oklch, var(--foreground) 14%, transparent)',
      }}
    >
      {side.image ? (
        <img src={side.image} alt="" className="size-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center px-4 text-center">
          <span className="line-clamp-2 text-sm font-medium tracking-wide">
            {label || (flipped ? 'B' : 'A')}
          </span>
        </div>
      )}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 32% 28%, oklch(1 0 0 / 22%), transparent 52%)',
        }}
      />
      {side.image ? (
        <span className="sr-only">{label || (flipped ? 'Lado B' : 'Lado A')}</span>
      ) : null}
    </div>
  )
}

function Coin3D({
  a,
  b,
  rotation,
  busy,
  onToss,
  onRest,
}: {
  a: CoinSide
  b: CoinSide
  rotation: number
  busy: boolean
  onToss: () => void
  onRest: () => void
}) {
  const radius = COIN_SIZE / 2
  return (
    <div className="relative pb-3" style={{ width: COIN_SIZE, height: COIN_SIZE }}>
      <div
        className="pointer-events-none absolute inset-x-6 -bottom-2 h-4 rounded-[100%] bg-foreground/20 blur-md"
        aria-hidden
      />
      <div
        className="perspective-[900px]"
        style={{ width: COIN_SIZE, height: COIN_SIZE }}
      >
        <div
          className="size-full"
          style={{ transform: 'rotateX(-18deg)', transformStyle: 'preserve-3d' }}
        >
          <motion.button
            type="button"
            aria-label="Girar moeda"
            disabled={busy}
            onClick={onToss}
            animate={{ rotateY: rotation }}
            transition={{ duration: SPIN_MS / 1000, ease: [0.12, 0.78, 0.08, 1] }}
            onAnimationComplete={onRest}
            className="relative size-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {Array.from({ length: EDGE_SLICES }, (_, index) => (
              <span
                key={index}
                className="pointer-events-none absolute top-0"
                style={{
                  left: '50%',
                  width: COIN_DEPTH,
                  height: COIN_SIZE,
                  marginLeft: -COIN_DEPTH / 2,
                  background:
                    'linear-gradient(to right, color-mix(in oklch, var(--foreground) 22%, var(--background)), color-mix(in oklch, var(--foreground) 8%, var(--background)), color-mix(in oklch, var(--foreground) 26%, var(--background)))',
                  transform: `rotateY(${(360 / EDGE_SLICES) * index}deg) translateZ(${radius}px)`,
                }}
              />
            ))}
            <CoinFace side={a} />
            <CoinFace side={b} flipped />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function SideEditor({
  side,
  value,
  disabled,
}: {
  side: CoinSideId
  value: CoinSide
  disabled: boolean
}) {
  const setLabel = useCoinStore((s) => s.setLabel)
  const setImage = useCoinStore((s) => s.setImage)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(file?: File) {
    if (!file) return
    try {
      const image = await fileToCoinImage(file)
      setImage(side, image)
    } catch {
      toast.message('Não deu para usar essa imagem.')
    }
  }

  return (
    <div className="space-y-2 rounded-lg border bg-background/60 p-3">
      <p className="text-xs font-medium text-muted-foreground">Lado {side === 'a' ? 'A' : 'B'}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        className="relative mx-auto flex size-28 items-center justify-center overflow-hidden rounded-full border bg-muted"
      >
        {value.image ? (
          <img src={value.image} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="size-5" />
            <span className="text-[11px]">Foto</span>
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          void onFile(file)
        }}
      />
      <div className="flex justify-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => fileRef.current?.click()}>
          <ImagePlus />
          {value.image ? 'Trocar' : 'Imagem'}
        </Button>
        {value.image ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => setImage(side, undefined)}
          >
            <X />
            Tirar foto
          </Button>
        ) : null}
      </div>
      <div>
        <Label htmlFor={`coin-label-${side}`}>Nome (opcional)</Label>
        <Input
          id={`coin-label-${side}`}
          className="mt-1.5"
          value={value.label}
          disabled={disabled}
          onChange={(e) => setLabel(side, e.target.value)}
          placeholder="Só a foto já vale"
        />
      </div>
    </div>
  )
}

export function CoinFlip() {
  const a = useCoinStore((s) => s.a)
  const b = useCoinStore((s) => s.b)
  const presetId = useCoinStore((s) => s.presetId)
  const applyPreset = useCoinStore((s) => s.applyPreset)
  const custom = presetId === 'custom' || Boolean(a.image || b.image) || !matchingPresetId(a.label, b.label)
  const [rotation, setRotation] = useState(0)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CoinSideId | undefined>(undefined)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const pending = useRef<CoinSideId | undefined>(undefined)

  function toss() {
    if (busy) return
    const next: CoinSideId = Math.random() < 0.5 ? 'a' : 'b'
    pending.current = next
    setBusy(true)
    setRotation((current) => landingRotation(current, next === 'a' ? 0 : 1))
  }

  function handleRest() {
    const next = pending.current
    if (!next) return
    pending.current = undefined
    const side = next === 'a' ? a : b
    setResult(next)
    setBusy(false)
    toast.success(`Deu ${sideCaption(side, next)}!`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-2">
        <Coin3D a={a} b={b} rotation={rotation} busy={busy} onToss={toss} onRest={handleRest} />
        <p className="min-h-5 text-sm font-medium">
          {busy
            ? 'Girando…'
            : result
              ? `Deu ${sideCaption(result === 'a' ? a : b, result)}!`
              : 'Toque na moeda'}
        </p>
        <Button type="button" onClick={toss} disabled={busy}>
          {busy ? 'Girando…' : 'Jogar moeda'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COIN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={busy}
            onClick={() => {
              applyPreset(preset)
              setResult(undefined)
            }}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              !custom && presetId === preset.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-accent/40',
            )}
          >
            {preset.a} ou {preset.b}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => setCustomizeOpen(true)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
            custom
              ? 'border-primary bg-primary/10 text-foreground'
              : 'text-muted-foreground hover:bg-accent/40',
          )}
        >
          <Settings2 className="size-3" />
          Personalizado
        </button>
      </div>

      <Drawer shouldScaleBackground={false} open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Personalizar moeda</DrawerTitle>
            <DrawerDescription>
              Pode ser só foto — o nome é opcional e não aparece em cima da imagem.
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto px-4 pb-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <SideEditor side="a" value={a} disabled={busy} />
              <SideEditor side="b" value={b} disabled={busy} />
            </div>
          </div>
          <DrawerFooter>
            <Button type="button" onClick={() => setCustomizeOpen(false)}>
              Pronto
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
