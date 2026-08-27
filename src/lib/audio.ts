let context: AudioContext | null = null

export function getAudioContext() {
  if (!context) context = new AudioContext()
  return context
}

export async function unlockAudio() {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

export function metallicPing(
  ctx: AudioContext,
  time: number,
  freq: number,
  duration: number,
  gain: number,
) {
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const amp = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, time)
  osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.72), time + duration)
  filter.type = 'highpass'
  filter.frequency.value = 500
  amp.gain.setValueAtTime(gain, time)
  amp.gain.exponentialRampToValueAtTime(0.0008, time + duration)
  osc.connect(filter)
  filter.connect(amp)
  amp.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + duration)
}

export function whoosh(ctx: AudioContext, time: number, duration: number, gain = 0.12) {
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
  filter.frequency.exponentialRampToValueAtTime(1600, time + duration * 0.35)
  filter.frequency.exponentialRampToValueAtTime(450, time + duration)
  filter.Q.value = 1.1
  amp.gain.setValueAtTime(0.0008, time)
  amp.gain.linearRampToValueAtTime(gain, time + 0.06)
  amp.gain.exponentialRampToValueAtTime(0.0008, time + duration)
  source.connect(filter)
  filter.connect(amp)
  amp.connect(ctx.destination)
  source.start(time)
  source.stop(time + duration)
}

export function noiseBurst(ctx: AudioContext, time: number, duration: number, gain: number) {
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
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2800, time)
  filter.frequency.exponentialRampToValueAtTime(180, time + duration)
  amp.gain.setValueAtTime(gain, time)
  amp.gain.exponentialRampToValueAtTime(0.0008, time + duration)
  source.connect(filter)
  filter.connect(amp)
  amp.connect(ctx.destination)
  source.start(time)
  source.stop(time + duration)
}

export function tick(ctx: AudioContext, time: number, gain: number) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = 1900
  amp.gain.setValueAtTime(gain, time)
  amp.gain.exponentialRampToValueAtTime(0.0008, time + 0.03)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.04)
}
