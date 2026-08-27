import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, Dices, RotateCw } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CoinFlip } from '@/tools/CoinFlip'
import { DiceRoller } from '@/tools/DiceRoller'
import { Roulette } from '@/tools/Roulette'

const tools = [
  { to: '/ferramentas/moeda', label: 'Cara ou coroa', hint: 'Sorteio binário', icon: Coins },
  { to: '/ferramentas/roleta', label: 'Roleta', hint: 'Lista de nomes ou itens', icon: RotateCw },
  { to: '/ferramentas/dados', label: 'Dados', hint: 'Qualquer número de lados', icon: Dices },
]

export function Ferramentas() {
  return (
    <PageContainer>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Ferramentas</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Usáveis soltas ou no meio de uma partida.
        </p>
      </header>
      <div className="grid gap-2 sm:grid-cols-3">
        {tools.map(({ to, label, hint, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl border bg-card/90 p-3 transition-colors hover:bg-accent/40"
          >
            <Icon className="mb-2 size-5 text-primary" />
            <p className="font-semibold">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}

function ToolPage({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <PageContainer>
      <header className="mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => navigate('/ferramentas')}
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </header>
      <Card className="bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </PageContainer>
  )
}

export function MoedaPage() {
  return (
    <ToolPage title="Cara ou coroa">
      <CoinFlip />
    </ToolPage>
  )
}

export function RoletaPage() {
  return (
    <ToolPage title="Roleta">
      <Roulette items={[]} allowEdit />
    </ToolPage>
  )
}

export function DadosPage() {
  return (
    <ToolPage title="Dados">
      <DiceRoller />
    </ToolPage>
  )
}
