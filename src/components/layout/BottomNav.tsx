import { NavLink } from 'react-router-dom'
import { navLinks } from '@/components/layout/nav'
import { cn } from '@/lib/utils'

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-stretch px-1">
        {navLinks.map(({ to, label, short, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {short ?? label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
