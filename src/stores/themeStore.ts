import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getFontStack, type FontId, type ThemeMode, type ThemePresetId } from '@/themes/presets'
import {
  WALLPAPER_DIM_DEFAULT,
  WALLPAPER_DIM_MAX,
  WALLPAPER_DIM_MIN,
  type WallpaperId,
} from '@/themes/wallpapers'

type ThemeState = {
  mode: ThemeMode
  preset: ThemePresetId
  font: FontId
  wallpaper: WallpaperId
  wallpaperDim: number
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  setPreset: (preset: ThemePresetId) => void
  setFont: (font: FontId) => void
  setWallpaper: (wallpaper: WallpaperId) => void
  setWallpaperDim: (wallpaperDim: number) => void
  applyToDocument: () => void
}

function clampDim(value: number) {
  return Math.min(WALLPAPER_DIM_MAX, Math.max(WALLPAPER_DIM_MIN, value))
}

function applyThemeToDocument(
  mode: ThemeMode,
  preset: ThemePresetId,
  font: FontId,
  wallpaper: WallpaperId,
  wallpaperDim: number,
) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.dataset.theme = preset
  root.dataset.mode = mode
  root.dataset.font = font
  root.dataset.wallpaper = wallpaper
  root.style.setProperty('--font-sans', getFontStack(font))
  root.style.setProperty('--wallpaper-dim', String(clampDim(wallpaperDim)))
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      preset: 'default',
      font: 'comfortaa',
      wallpaper: 'none',
      wallpaperDim: WALLPAPER_DIM_DEFAULT,
      setMode: (mode) => {
        set({ mode })
        const { preset, font, wallpaper, wallpaperDim } = get()
        applyThemeToDocument(mode, preset, font, wallpaper, wallpaperDim)
      },
      toggleMode: () => {
        const mode = get().mode === 'light' ? 'dark' : 'light'
        get().setMode(mode)
      },
      setPreset: (preset) => {
        set({ preset })
        const { mode, font, wallpaper, wallpaperDim } = get()
        applyThemeToDocument(mode, preset, font, wallpaper, wallpaperDim)
      },
      setFont: (font) => {
        set({ font })
        const { mode, preset, wallpaper, wallpaperDim } = get()
        applyThemeToDocument(mode, preset, font, wallpaper, wallpaperDim)
      },
      setWallpaper: (wallpaper) => {
        set({ wallpaper })
        const { mode, preset, font, wallpaperDim } = get()
        applyThemeToDocument(mode, preset, font, wallpaper, wallpaperDim)
      },
      setWallpaperDim: (wallpaperDim) => {
        const next = clampDim(wallpaperDim)
        set({ wallpaperDim: next })
        const { mode, preset, font, wallpaper } = get()
        applyThemeToDocument(mode, preset, font, wallpaper, next)
      },
      applyToDocument: () => {
        const { mode, preset, font, wallpaper, wallpaperDim } = get()
        applyThemeToDocument(mode, preset, font, wallpaper, wallpaperDim)
      },
    }),
    {
      name: 'pontos-theme',
      onRehydrateStorage: () => (state) => {
        state?.applyToDocument()
      },
    },
  ),
)
