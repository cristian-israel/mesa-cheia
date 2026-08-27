import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { SessionCard } from '@/components/session/SessionCard'
import { listSessions, useSessionStore } from '@/stores/sessionStore'

export function Home() {
  const sessions = useSessionStore((s) => s.sessions)
  const deleteSession = useSessionStore((s) => s.deleteSession)
  const all = listSessions(sessions)
  const active = all.filter((s) => s.status === 'active')
  const finished = all.filter((s) => s.status === 'finished')

  return (
    <PageContainer>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Partidas</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tudo fica neste aparelho — sem conta e sem internet.
        </p>
      </header>

      {all.length === 0 ? (
        <Card className="bg-card/90">
          <CardHeader>
            <CardTitle>Mesa vazia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Crie uma partida de Canastra ou Poker para começar a marcar.
            </p>
            <Button asChild>
              <Link to="/novo">
                <Plus />
                Novo jogo
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Em andamento
              {active.length > 0 ? ` · ${active.length}` : ''}
            </h2>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma partida ativa.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {active.map((session) => (
                  <SessionCard key={session.id} session={session} onDelete={deleteSession} />
                ))}
              </div>
            )}
          </section>

          {finished.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Encerradas
                {` · ${finished.length}`}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {finished.map((session) => (
                  <SessionCard key={session.id} session={session} onDelete={deleteSession} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </PageContainer>
  )
}
