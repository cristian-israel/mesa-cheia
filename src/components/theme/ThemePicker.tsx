import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FONT_OPTIONS, THEME_PRESETS, type FontId, type ThemePresetId } from '@/themes/presets'
import {
  WALLPAPER_DIM_MAX,
  WALLPAPER_DIM_MIN,
  WALLPAPERS,
  type WallpaperId,
} from '@/themes/wallpapers'
import { useThemeStore } from '@/stores/themeStore'

export function ThemePicker() {
  const mode = useThemeStore((s) => s.mode)
  const preset = useThemeStore((s) => s.preset)
  const font = useThemeStore((s) => s.font)
  const wallpaper = useThemeStore((s) => s.wallpaper)
  const wallpaperDim = useThemeStore((s) => s.wallpaperDim)
  const setMode = useThemeStore((s) => s.setMode)
  const setPreset = useThemeStore((s) => s.setPreset)
  const setFont = useThemeStore((s) => s.setFont)
  const setWallpaper = useThemeStore((s) => s.setWallpaper)
  const setWallpaperDim = useThemeStore((s) => s.setWallpaperDim)

  const dimPercent = Math.round(wallpaperDim * 100)

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Aparência
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            className="shrink-0 gap-1.5"
          >
            {mode === 'light' ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
            {mode === 'light' ? 'Escuro' : 'Claro'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEME_PRESETS.map((item) => {
            const active = preset === item.id
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setPreset(item.id as ThemePresetId)}
                className={cn(
                  'min-w-0 rounded-lg border bg-card/90 p-2 text-left transition-colors',
                  active ? 'border-primary ring-2 ring-primary/30' : 'hover:bg-accent/40',
                )}
              >
                <div className="mb-1.5 flex gap-1">
                  {item.swatch.map((color) => (
                    <span
                      key={color}
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium">{item.label}</p>
              </motion.button>
            )
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Papel de parede
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {WALLPAPERS.map((item) => {
            const active = wallpaper === item.id
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setWallpaper(item.id as WallpaperId)}
                className={cn(
                  'min-w-0 rounded-lg border bg-card/90 p-1.5 text-left transition-colors',
                  active ? 'border-primary ring-2 ring-primary/30' : 'hover:bg-accent/40',
                )}
              >
                <div
                  className="mb-1.5 aspect-3/4 overflow-hidden rounded-md border"
                  style={
                    item.image
                      ? { backgroundImage: item.image }
                      : { backgroundColor: 'var(--background)' }
                  }
                >
                  {item.image ? (
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundColor: `color-mix(in oklch, var(--background) ${dimPercent}%, transparent)`,
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-1 text-center text-[9px] leading-tight text-muted-foreground">
                      Sem fundo
                    </div>
                  )}
                </div>
                <p className="truncate text-[11px] font-medium">{item.label}</p>
              </motion.button>
            )
          })}
        </div>

        {wallpaper !== 'none' ? (
          <div className="rounded-lg border bg-card/90 px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label htmlFor="wallpaper-dim" className="text-xs font-medium">
                Cortina
              </label>
              <span className="text-[11px] tabular-nums text-muted-foreground">{dimPercent}%</span>
            </div>
            <input
              id="wallpaper-dim"
              type="range"
              min={Math.round(WALLPAPER_DIM_MIN * 100)}
              max={Math.round(WALLPAPER_DIM_MAX * 100)}
              value={dimPercent}
              onChange={(event) => setWallpaperDim(Number(event.target.value) / 100)}
              className="h-8 w-full accent-primary"
            />
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Mais cortina, mais fácil de ler o placar.
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Fonte
        </h2>
        <div className="grid gap-1.5">
          {FONT_OPTIONS.map((item) => {
            const active = font === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFont(item.id as FontId)}
                className={cn(
                  'min-w-0 rounded-lg border bg-card/90 px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'hover:bg-accent/40',
                )}
                style={{ fontFamily: item.stack }}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Aa Bb Cc 123 — mesa cheia de pontos
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
