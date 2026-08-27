import { NavLink } from 'react-router-dom'
import { Dices, PanelLeftClose, PanelLeftOpen, Plus, Settings, Spade } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'

const links = [
  { to: '/', label: 'Partidas', icon: Spade, end: true },
  { to: '/novo', label: 'Novo jogo', icon: Plus, end: false },
  { to: '/ferramentas', label: 'Ferramentas', icon: Dices, end: false },
  { to: '/configuracoes', label: 'Ajustes', icon: Settings, end: false },
]

export function SideNav() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-background/80 p-3 backdrop-blur transition-[width] duration-200 md:flex',
        collapsed ? 'w-17' : 'w-56',
      )}
    >
      <div className={cn('mb-4 flex items-center gap-1', collapsed ? 'flex-col' : 'justify-between')}>
        {collapsed ? null : (
          <p className="min-w-0 truncate px-2 pt-1 text-sm font-bold tracking-tight">Mesa Cheia</p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="shrink-0"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
      <nav className="grid gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {collapsed ? <span className="sr-only">{label}</span> : label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
