import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace, type Group, type Texture } from 'three'
import type { CoinSide } from '@/stores/coinStore'

const SPIN_MS = 2800
const RADIUS = 1
const THICKNESS = 0.18

export type CoinSpin = {
  id: number
  face: 0 | 1
}

function cssColor(variable: string, fallback: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${variable})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color || fallback
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 2)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image'))
    image.src = src
  })
}

async function makeFaceTexture(side: CoinSide, muted: boolean) {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  if (side.image) {
    const image = await loadImage(side.image)
    const scale = Math.max(size / image.width, size / image.height)
    const width = image.width * scale
    const height = image.height * scale
    ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
  } else {
    ctx.fillStyle = cssColor(muted ? '--muted' : '--card', muted ? '#d4d4d4' : '#f4f4f5')
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = cssColor('--foreground', '#171717')
    ctx.globalAlpha = 0.22
    ctx.lineWidth = 28
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 22, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = cssColor('--foreground', '#171717')
    ctx.font = '700 140px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const label = side.label.trim() || (muted ? 'B' : 'A')
    const lines = wrapLines(ctx, label, size * 0.72)
    const lineHeight = 160
    const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((line, index) => {
      ctx.fillText(line, size / 2, startY + index * lineHeight)
    })
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function nextFlip(current: number, face: 0 | 1) {
  const tau = Math.PI * 2
  const spins = 7 + Math.floor(Math.random() * 4)
  const want = face * Math.PI
  const mod = ((current % tau) + tau) % tau
  const extra = (want - mod + tau) % tau
  return current + spins * tau + extra
}

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4
}

function Face({
  map,
  z,
  flipped,
}: {
  map?: Texture
  z: number
  flipped?: boolean
}) {
  return (
    <mesh position={[0, 0, z]} rotation={[0, flipped ? Math.PI : 0, 0]}>
      <circleGeometry args={[RADIUS, 96]} />
      <meshStandardMaterial
        map={map}
        color="#ffffff"
        roughness={0.45}
        metalness={0.12}
        toneMapped={false}
      />
    </mesh>
  )
}

function CoinMesh({
  a,
  b,
  spin,
  busy,
  onToss,
  onRest,
}: {
  a: CoinSide
  b: CoinSide
  spin?: CoinSpin
  busy: boolean
  onToss: () => void
  onRest: () => void
}) {
  const spinRef = useRef<Group>(null)
  const [maps, setMaps] = useState<{ front?: Texture; back?: Texture }>({})
  const flipRef = useRef(0)
  const idleOriginRef = useRef(0)
  const animRef = useRef<{ from: number; to: number; start: number; notified: boolean } | null>(null)
  const onRestRef = useRef(onRest)
  const mapsHold = useRef(maps)
  onRestRef.current = onRest
  mapsHold.current = maps

  useEffect(() => {
    return () => {
      mapsHold.current.front?.dispose()
      mapsHold.current.back?.dispose()
    }
  }, [])

  useEffect(() => {
    let live = true
    void Promise.all([makeFaceTexture(a, false), makeFaceTexture(b, true)]).then(([front, back]) => {
      if (!live) {
        front.dispose()
        back.dispose()
        return
      }
      setMaps((current) => {
        current.front?.dispose()
        current.back?.dispose()
        return { front, back }
      })
    })
    return () => {
      live = false
    }
  }, [a.label, a.image, b.label, b.image])

  useEffect(() => {
    if (!spin) return
    animRef.current = {
      from: flipRef.current,
      to: nextFlip(flipRef.current, spin.face),
      start: performance.now(),
      notified: false,
    }
  }, [spin?.id, spin?.face])

  useFrame((state) => {
    const group = spinRef.current
    if (!group) return
    const anim = animRef.current
    const time = state.clock.elapsedTime

    if (anim) {
      const t = Math.min(1, (performance.now() - anim.start) / SPIN_MS)
      flipRef.current = anim.from + (anim.to - anim.from) * easeOutQuart(t)
      group.rotation.y = flipRef.current
      group.rotation.z = Math.sin(t * Math.PI) * 0.12
      group.position.y = Math.sin(t * Math.PI) * 0.22
      if (t >= 1 && !anim.notified) {
        anim.notified = true
        animRef.current = null
        idleOriginRef.current = time
        group.rotation.y = flipRef.current
        group.rotation.z = 0
        group.position.y = 0
        queueMicrotask(() => onRestRef.current())
      }
      return
    }

    const idle = time - idleOriginRef.current
    group.rotation.y = flipRef.current + Math.sin(idle * 0.7) * 0.16
    group.rotation.z = Math.sin(idle * 0.9) * 0.04
    group.position.y = Math.sin(idle * 1.1) * 0.02
  })

  const edge = cssColor('--muted-foreground', '#a1a1aa')
  const half = THICKNESS / 2 + 0.002

  return (
    <group rotation={[-0.38, 0.28, 0]}>
      <group
        ref={spinRef}
        onPointerDown={(event) => {
          event.stopPropagation()
          if (!busy) onToss()
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[RADIUS, RADIUS, THICKNESS, 96, 1, true]} />
          <meshStandardMaterial color={edge} metalness={0.88} roughness={0.28} />
        </mesh>
        {maps.front ? <Face map={maps.front} z={half} /> : null}
        {maps.back ? <Face map={maps.back} z={-half} flipped /> : null}
      </group>
    </group>
  )
}

export function Coin3DCanvas({
  a,
  b,
  spin,
  busy,
  onToss,
  onRest,
}: {
  a: CoinSide
  b: CoinSide
  spin?: CoinSpin
  busy: boolean
  onToss: () => void
  onRest: () => void
}) {
  return (
    <div className="mx-auto aspect-square w-full max-w-[18rem]">
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.12, 5.2], fov: 28 }}
      >
        <ambientLight intensity={0.8} />
        <hemisphereLight args={['#fff6e8', '#1a1a1a', 0.5]} />
        <directionalLight position={[2.4, 2.8, 4]} intensity={1.2} />
        <directionalLight position={[-2, 0.4, 2]} intensity={0.4} />
        <CoinMesh a={a} b={b} spin={spin} busy={busy} onToss={onToss} onRest={onRest} />
        <ContactShadows position={[0, -1.25, 0]} opacity={0.28} scale={5} blur={2.8} far={2.4} />
      </Canvas>
    </div>
  )
}
