import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CircleHelp } from 'lucide-react'
import { GameGuideDrawer } from '@/components/game/GameGuideDrawer'
import { Button } from '@/components/ui/button'
import { getGame } from '@/lib/game-registry'

export function GameGuideButton({ gameId }: { gameId?: string }) {
  const params = useParams()
  const id = gameId ?? params.gameId
  const game = id ? getGame(id) : undefined
  const [open, setOpen] = useState(false)

  if (!game?.guide) return null

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Como jogar ${game.label}`}
        onClick={() => setOpen(true)}
      >
        <CircleHelp />
      </Button>
      <GameGuideDrawer game={game} open={open} onOpenChange={setOpen} />
    </>
  )
}
