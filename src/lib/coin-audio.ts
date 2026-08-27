import { metallicPing, unlockAudio, whoosh } from '@/lib/audio'

let spinStop: (() => void) | null = null

export async function playCoinSpin() {
  spinStop?.()
  const ctx = await unlockAudio()
  const start = ctx.currentTime
  whoosh(ctx, start, 0.55)
  const count = 14
  for (let i = 0; i < count; i += 1) {
    const t = start + 0.04 + i * i * 0.012
    if (t > start + 2.4) break
    metallicPing(ctx, t, 1800 - i * 55, 0.07, 0.045 * (1 - i / count))
  }
  spinStop = () => {
    spinStop = null
  }
}

export async function playCoinLand() {
  spinStop?.()
  const ctx = await unlockAudio()
  const t = ctx.currentTime
  metallicPing(ctx, t, 2400, 0.22, 0.16)
  metallicPing(ctx, t + 0.018, 3200, 0.16, 0.1)
  metallicPing(ctx, t + 0.05, 1400, 0.28, 0.08)
  whoosh(ctx, t, 0.18)
}
