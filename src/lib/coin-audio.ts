let context: AudioContext | null = null
let spinStop: (() => void) | null = null

function getContext() {
  if (!context) {
    context = new AudioContext()
  }
  return context
}

async function unlock() {
  const ctx = getContext()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

function metallicPing(ctx: AudioContext, time: number, freq: number, duration: number, gain: number) {
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const amp = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, time)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.72, time + duration)
  filter.type = 'highpass'
  filter.frequency.value = 600
  amp.gain.setValueAtTime(gain, time)
  amp.gain.exponentialRampToValueAtTime(0.0008, time + duration)
  osc.connect(filter)
  filter.connect(amp)
  amp.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + duration)
}

function whoosh(ctx: AudioContext, time: number, duration: number) {
  const length = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  }
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const amp = ctx.createGain()
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(400, time)
  filter.frequency.exponentialRampToValueAtTime(1800, time + duration * 0.35)
  filter.frequency.exponentialRampToValueAtTime(500, time + duration)
  filter.Q.value = 1.2
  amp.gain.setValueAtTime(0.0008, time)
  amp.gain.linearRampToValueAtTime(0.12, time + 0.08)
  amp.gain.exponentialRampToValueAtTime(0.0008, time + duration)
  source.connect(filter)
  filter.connect(amp)
  amp.connect(ctx.destination)
  source.start(time)
  source.stop(time + duration)
}

export async function playCoinSpin() {
  spinStop?.()
  const ctx = await unlock()
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
  const ctx = await unlock()
  const t = ctx.currentTime
  metallicPing(ctx, t, 2400, 0.22, 0.16)
  metallicPing(ctx, t + 0.018, 3200, 0.16, 0.1)
  metallicPing(ctx, t + 0.05, 1400, 0.28, 0.08)
  whoosh(ctx, t, 0.18)
}
