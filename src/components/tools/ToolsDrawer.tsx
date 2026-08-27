import { useState } from 'react'
import { Coins, Crosshair, Dices, RotateCw } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { CoinFlip } from '@/tools/CoinFlip'
import { DiceRoller } from '@/tools/DiceRoller'
import { Roulette } from '@/tools/Roulette'
import { RussianRoulette } from '@/tools/RussianRoulette'

type ToolId = 'menu' | 'moeda' | 'roleta' | 'russa' | 'dados'

type ToolsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items?: string[]
}

const options = [
  { id: 'moeda' as const, label: 'Cara ou coroa', icon: Coins },
  { id: 'roleta' as const, label: 'Roleta', icon: RotateCw },
  { id: 'russa' as const, label: 'Roleta russa', icon: Crosshair },
  { id: 'dados' as const, label: 'Dados', icon: Dices },
]

export function ToolsDrawer({ open, onOpenChange, items = [] }: ToolsDrawerProps) {
  const [tool, setTool] = useState<ToolId>('menu')

  function handleOpen(next: boolean) {
    if (!next) setTool('menu')
    onOpenChange(next)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {tool === 'menu' && 'Ferramentas'}
            {tool === 'moeda' && 'Cara ou coroa'}
            {tool === 'roleta' && 'Roleta'}
            {tool === 'russa' && 'Roleta russa'}
            {tool === 'dados' && 'Dados'}
          </DrawerTitle>
          <DrawerDescription>
            {tool === 'menu'
              ? 'Sorteios rápidos sem sair da partida.'
              : 'Volte ao menu para trocar de ferramenta.'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {tool === 'menu' ? (
            <div className="grid gap-2 pb-2">
              {options.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTool(id)}
                  className="flex items-center gap-3 rounded-xl border bg-card/90 px-3 py-3 text-left"
                >
                  <Icon className="size-4 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              <button
                type="button"
                className="text-xs font-medium text-primary"
                onClick={() => setTool('menu')}
              >
                ← Menu
              </button>
              {tool === 'moeda' ? <CoinFlip /> : null}
              {tool === 'roleta' ? (
                <Roulette items={items} allowEdit={items.length === 0} />
              ) : null}
              {tool === 'russa' ? <RussianRoulette /> : null}
              {tool === 'dados' ? <DiceRoller /> : null}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
