export type ThemeMode = 'light' | 'dark'

export type ThemePresetId =
  | 'default'
  | 'ocean'
  | 'forest'
  | 'amber'
  | 'slate'
  | 'rose'
  | 'contrast'

export type FontId =
  | 'comfortaa'
  | 'nunito'
  | 'dm-sans'
  | 'outfit'
  | 'manrope'
  | 'space-grotesk'
  | 'system'

export type ThemePreset = {
  id: ThemePresetId
  label: string
  swatch: [string, string, string]
}

export type FontOption = {
  id: FontId
  label: string
  stack: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', label: 'Default', swatch: ['#171717', '#737373', '#f5f5f5'] },
  { id: 'ocean', label: 'Ocean', swatch: ['#0c4a6e', '#0ea5e9', '#e0f2fe'] },
  { id: 'forest', label: 'Forest', swatch: ['#14532d', '#22c55e', '#dcfce7'] },
  { id: 'amber', label: 'Amber', swatch: ['#92400e', '#f59e0b', '#fef3c7'] },
  { id: 'slate', label: 'Slate', swatch: ['#0f172a', '#64748b', '#f1f5f9'] },
  { id: 'rose', label: 'Rose', swatch: ['#9f1239', '#f43f5e', '#ffe4e6'] },
  { id: 'contrast', label: 'Alto contraste', swatch: ['#000000', '#ffff00', '#ffffff'] },
]

export const FONT_OPTIONS: FontOption[] = [
  { id: 'comfortaa', label: 'Comfortaa', stack: "'Comfortaa', ui-rounded, system-ui, sans-serif" },
  { id: 'nunito', label: 'Nunito', stack: "'Nunito', system-ui, sans-serif" },
  { id: 'dm-sans', label: 'DM Sans', stack: "'DM Sans', system-ui, sans-serif" },
  { id: 'outfit', label: 'Outfit', stack: "'Outfit', system-ui, sans-serif" },
  { id: 'manrope', label: 'Manrope', stack: "'Manrope', system-ui, sans-serif" },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    stack: "'Space Grotesk', system-ui, sans-serif",
  },
  {
    id: 'system',
    label: 'System',
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
]

export function getFontStack(fontId: FontId): string {
  return FONT_OPTIONS.find((f) => f.id === fontId)?.stack ?? FONT_OPTIONS[0].stack
}
