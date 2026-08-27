import { Github } from 'lucide-react'
import { cn } from '@/lib/utils'

const AUTHOR = 'Cristian Israel'
const GITHUB_URL = 'https://github.com/cristian-israel'
const CREATED_YEAR = 2026

export function AppFooter({
  className,
  compact = false,
  collapsed = false,
}: {
  className?: string
  compact?: boolean
  collapsed?: boolean
}) {
  if (collapsed) {
    return (
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`GitHub de ${AUTHOR}`}
        title={`${AUTHOR} no GitHub`}
        className={cn(
          'mt-auto flex justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground',
          className,
        )}
      >
        <Github className="size-4" />
      </a>
    )
  }

  return (
    <footer
      className={cn(
        'shrink-0 text-[11px] leading-relaxed text-muted-foreground',
        compact ? 'pt-4 text-[10px]' : 'mt-auto pt-8 text-center',
        className,
      )}
    >
      <p className="whitespace-nowrap">
        © {CREATED_YEAR} Mesa Cheia · Criado por{' '}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
        >
          {AUTHOR}
        </a>
      </p>
    </footer>
  )
}
