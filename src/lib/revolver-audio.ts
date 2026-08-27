import { metallicPing, noiseBurst, tick, unlockAudio, whoosh } from '@/lib/audio'

export const CYLINDER_SPIN_S = 1.35

export async function playCylinderSpin() {
  const ctx = await unlockAudio()
  const start = ctx.currentTime
  whoosh(ctx, start, 0.28, 0.06)
  let t = 0.04
  let gap = 0.032
  while (t < CYLINDER_SPIN_S - 0.08) {
    const fade = 1 - t / CYLINDER_SPIN_S
    tick(ctx, start + t, 0.034 * (0.4 + fade * 0.6))
    t += gap
    gap *= 1.08
  }
}

export async function playDryFire() {
  const ctx = await unlockAudio()
  const t = ctx.currentTime
  metallicPing(ctx, t, 520, 0.09, 0.1)
  tick(ctx, t, 0.05)
  whoosh(ctx, t, 0.08, 0.04)
}

export async function playBang() {
  const ctx = await unlockAudio()
  const t = ctx.currentTime
  noiseBurst(ctx, t, 0.42, 0.22)
  metallicPing(ctx, t, 180, 0.35, 0.18)
  metallicPing(ctx, t + 0.02, 90, 0.5, 0.14)
  whoosh(ctx, t, 0.35, 0.16)
}
