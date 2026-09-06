import { Hand } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Marca no placar quem está dando as cartas. */
export function DealerMark({ className }: { className?: string }) {
  return (
    <span
      title="Dá as cartas"
      aria-label="Dá as cartas"
      className={cn('inline-flex shrink-0', className)}
    >
      <Hand className="size-4 text-muted-foreground" aria-hidden />
    </span>
  )
}
