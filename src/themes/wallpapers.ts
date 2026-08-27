export type WallpaperId =
  | 'none'
  | 'mesa'
  | 'aurora'
  | 'linho'
  | 'oceano'
  | 'pedra'
  | 'jardim'

export type WallpaperOption = {
  id: WallpaperId
  label: string
  /** CSS `background-image` layers. Absent when id is `none`. */
  image?: string
}

export const WALLPAPER_DIM_MIN = 0.25
export const WALLPAPER_DIM_MAX = 0.8
export const WALLPAPER_DIM_DEFAULT = 0.5

export const WALLPAPERS: WallpaperOption[] = [
  { id: 'none', label: 'Nenhum' },
  {
    id: 'mesa',
    label: 'Mesa',
    image: [
      'radial-gradient(ellipse at 50% 0%, rgb(255 255 255 / 0.08), transparent 42%)',
      'repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 18px, rgb(0 0 0 / 0.08) 19px, transparent 22px)',
      'linear-gradient(165deg, #1a4a2a, #14532d 48%, #0f3d22)',
    ].join(', '),
  },
  {
    id: 'aurora',
    label: 'Aurora',
    image: [
      'radial-gradient(at 18% 22%, #6d5b9c 0px, transparent 46%)',
      'radial-gradient(at 82% 38%, #1a8a8a 0px, transparent 42%)',
      'radial-gradient(at 42% 82%, #c97b4a 0px, transparent 38%)',
      'linear-gradient(180deg, #1a1230, #241848 48%, #122a3a)',
    ].join(', '),
  },
  {
    id: 'linho',
    label: 'Linho',
    image: [
      'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgb(80 60 30 / 0.045) 3px)',
      'repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgb(80 60 30 / 0.03) 3px)',
      'radial-gradient(ellipse at 50% 0%, rgb(255 250 240 / 0.55), transparent 55%)',
      'linear-gradient(180deg, #f4ead8, #e6d5bc)',
    ].join(', '),
  },
  {
    id: 'oceano',
    label: 'Oceano',
    image: [
      'radial-gradient(ellipse 120% 70% at 50% 110%, #0a6a78, transparent)',
      'repeating-linear-gradient(180deg, transparent 0, transparent 26px, rgb(255 255 255 / 0.045) 28px, transparent 42px)',
      'radial-gradient(at 20% 20%, #1a6b7a 0px, transparent 40%)',
      'linear-gradient(180deg, #0b3a4a, #062830 42%, #0a5568)',
    ].join(', '),
  },
  {
    id: 'pedra',
    label: 'Pedra',
    image: [
      'radial-gradient(ellipse at 18% 28%, #5a616c 0%, transparent 52%)',
      'radial-gradient(ellipse at 82% 18%, #3d424a 0%, transparent 46%)',
      'radial-gradient(ellipse at 48% 82%, #6b6358 0%, transparent 50%)',
      'linear-gradient(165deg, #2a2d33, #3f444c)',
    ].join(', '),
  },
  {
    id: 'jardim',
    label: 'Jardim',
    image: [
      'radial-gradient(at 30% 18%, #6b8f5e 0px, transparent 42%)',
      'radial-gradient(at 82% 48%, #2d5a3d 0px, transparent 46%)',
      'radial-gradient(at 18% 82%, #8fae6e 0px, transparent 40%)',
      'linear-gradient(180deg, #1a3324, #243d2c 50%, #2d4a32)',
    ].join(', '),
  },
]

export function getWallpaper(id: WallpaperId): WallpaperOption {
  return WALLPAPERS.find((item) => item.id === id) ?? WALLPAPERS[0]
}
