import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { GameDefinition, GameGuideAttachment } from '@/lib/game-registry'

type Tab = 'guide' | 'attachments'

function GuideMarkdown({ markdown }: { markdown: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: () => null,
      }}
    >
      {markdown}
    </Markdown>
  )
}

function AttachmentLightbox({
  item,
  onClose,
}: {
  item: GameGuideAttachment
  onClose: () => void
}) {
  const [wide, setWide] = useState(false)
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight >= window.innerWidth,
  )

  useEffect(() => {
    function sync() {
      setPortrait(window.innerHeight >= window.innerWidth)
    }
    sync()
    window.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('resize', sync)
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const hintRotate = wide && portrait

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
      className="fixed inset-0 z-80 bg-black"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>
      <img
        src={item.src}
        alt={item.label}
        className="size-full object-contain"
        onClick={(event) => event.stopPropagation()}
        onLoad={(event) => {
          const image = event.currentTarget
          setWide(image.naturalWidth > image.naturalHeight)
        }}
      />
      {hintRotate ? (
        <p className="pointer-events-none absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-white/80">
          Deite o telefone para ver melhor
        </p>
      ) : null}
    </div>,
    document.body,
  )
}

export function GameGuideDrawer({
  game,
  open,
  onOpenChange,
}: {
  game: GameDefinition
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const guide = game.guide
  const attachments = guide?.attachments ?? []
  const hasAttachments = attachments.length > 0
  const [tab, setTab] = useState<Tab>('guide')
  const [viewing, setViewing] = useState<GameGuideAttachment>()

  useEffect(() => {
    if (open) return
    setTab('guide')
    setViewing(undefined)
  }, [open, game.id])

  if (!guide) return null

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (viewing) return
          onOpenChange(next)
        }}
      >
        <DrawerContent className="h-[92dvh]">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>{game.label}</DrawerTitle>
            <DrawerDescription>Como se joga nesta mesa.</DrawerDescription>
          </DrawerHeader>

          {hasAttachments ? (
            <div className="mx-4 mb-2 grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-medium',
                  tab === 'guide' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setTab('guide')}
              >
                Guia
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-medium',
                  tab === 'attachments' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setTab('attachments')}
              >
                Anexos
              </button>
            </div>
          ) : null}

          <ScrollArea className="min-h-0 min-w-0 flex-1">
            <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {tab === 'guide' || !hasAttachments ? (
                <div className="game-guide pb-2">
                  <GuideMarkdown markdown={guide.markdown} />
                </div>
              ) : (
                <div className="space-y-2 pb-2">
                  {attachments.map((item) =>
                    item.kind === 'file' ? (
                      <a
                        key={item.id}
                        href={item.src}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border bg-card/90 px-3 py-2 text-sm font-medium text-primary"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full space-y-1.5 rounded-lg border bg-card/90 p-2 text-left"
                        onClick={() => setViewing(item)}
                      >
                        <img
                          src={item.src}
                          alt=""
                          className="max-h-40 w-full rounded-md object-cover object-top"
                        />
                        <p className="px-1 text-sm font-medium">{item.label}</p>
                        <p className="px-1 text-[11px] text-muted-foreground">Toque para ver em tela cheia</p>
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {viewing ? <AttachmentLightbox item={viewing} onClose={() => setViewing(undefined)} /> : null}
    </>
  )
}
