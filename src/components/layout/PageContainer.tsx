import type { ReactNode } from 'react'
import { AppFooter } from '@/components/layout/AppFooter'
import { cn } from '@/lib/utils'

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-24 pt-[max(0.75rem,env(safe-area-inset-top))] md:max-w-4xl md:pb-8 md:pt-6',
        className,
      )}
    >
      {children}
      <AppFooter />
    </div>
  )
}
