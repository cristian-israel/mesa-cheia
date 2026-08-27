import { Link, useParams } from 'react-router-dom'
import { getGame } from '@/lib/game-registry'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/stores/sessionStore'

export function Jogo() {
  const { gameId, sessionId } = useParams()
  const session = useSessionStore((s) => (sessionId ? s.sessions[sessionId] : undefined))
  const def = gameId ? getGame(gameId) : undefined

  if (!def || !sessionId || !session || session.gameId !== def.id) {
    return (
      <PageContainer>
        <h1 className="text-xl font-bold">Partida não encontrada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Essa sessão não existe neste aparelho — ou o jogo não está registrado.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Voltar às partidas</Link>
        </Button>
      </PageContainer>
    )
  }

  const Screen = def.ScreenComponent
  return <Screen sessionId={sessionId} />
}
