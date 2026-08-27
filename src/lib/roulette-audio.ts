import { metallicPing, tick, unlockAudio, whoosh } from '@/lib/audio'

const SPIN_S = 3.2

export async function playRouletteSpin() {
  const ctx = await unlockAudio()
  const start = ctx.currentTime
  whoosh(ctx, start, 0.4, 0.08)
  let t = 0.05
  let gap = 0.038
  while (t < SPIN_S - 0.12) {
    const fade = 1 - t / SPIN_S
    tick(ctx, start + t, 0.028 * (0.45 + fade * 0.55))
    t += gap
    gap *= 1.075
  }
}

export async function playRouletteLand() {
  const ctx = await unlockAudio()
  const t = ctx.currentTime
  metallicPing(ctx, t, 880, 0.18, 0.12)
  metallicPing(ctx, t + 0.03, 1320, 0.22, 0.09)
  tick(ctx, t, 0.06)
}

export { SPIN_S as ROULETTE_SPIN_S }
