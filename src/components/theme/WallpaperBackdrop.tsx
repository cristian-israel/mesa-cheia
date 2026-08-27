import { getWallpaper } from '@/themes/wallpapers'
import { useThemeStore } from '@/stores/themeStore'

export function WallpaperBackdrop() {
  const wallpaper = useThemeStore((s) => s.wallpaper)
  const dim = useThemeStore((s) => s.wallpaperDim)
  const preset = getWallpaper(wallpaper)

  if (wallpaper === 'none' || !preset.image) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0" style={{ backgroundImage: preset.image }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `color-mix(in oklch, var(--background) ${Math.round(dim * 100)}%, transparent)`,
        }}
      />
    </div>
  )
}
