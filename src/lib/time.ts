export function formatWhen(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
}

export function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (totalMinutes < 1) return 'menos de 1 min'
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function sessionDurationMs(createdAt: number, finishedAt?: number, now = Date.now()) {
  return Math.max(0, (finishedAt ?? now) - createdAt)
}
