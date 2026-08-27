import { Dices, Plus, Settings, Spade, Trophy, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  short?: string
  icon: LucideIcon
  end: boolean
}

export const navLinks: NavItem[] = [
  { to: '/', label: 'Partidas', icon: Spade, end: true },
  { to: '/ranking', label: 'Ranking', icon: Trophy, end: false },
  { to: '/novo', label: 'Novo jogo', short: 'Novo', icon: Plus, end: false },
  { to: '/ferramentas', label: 'Ferramentas', icon: Dices, end: false },
  { to: '/configuracoes', label: 'Ajustes', icon: Settings, end: false },
]
