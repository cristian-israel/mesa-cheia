import { NavLink } from 'react-router-dom'
import { Dices, Plus, Settings, Spade } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Partidas', icon: Spade, end: true },
  { to: '/novo', label: 'Novo', icon: Plus, end: false },
  { to: '/ferramentas', label: 'Ferramentas', icon: Dices, end: false },
  { to: '/configuracoes', label: 'Ajustes', icon: Settings, end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
