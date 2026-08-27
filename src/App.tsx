import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { WallpaperBackdrop } from '@/components/theme/WallpaperBackdrop'
import { Configuracoes } from '@/routes/Configuracoes'
import { DadosPage, Ferramentas, MoedaPage, RoletaPage, RoletaRussaPage } from '@/routes/Ferramentas'
import { Home } from '@/routes/Home'
import { Jogo } from '@/routes/Jogo'
import { NovoJogo } from '@/routes/NovoJogo'
import { Ranking } from '@/routes/Ranking'
import { useStoresHydrated } from '@/lib/use-stores-hydrated'
import { useThemeStore } from '@/stores/themeStore'
import '@/games'

export default function App() {
  const hydrated = useStoresHydrated()
  const applyToDocument = useThemeStore((s) => s.applyToDocument)
  const mode = useThemeStore((s) => s.mode)
  const preset = useThemeStore((s) => s.preset)
  const font = useThemeStore((s) => s.font)
  const wallpaper = useThemeStore((s) => s.wallpaper)
  const wallpaperDim = useThemeStore((s) => s.wallpaperDim)

  useEffect(() => {
    applyToDocument()
  }, [applyToDocument, mode, preset, font, wallpaper, wallpaperDim])

  if (!hydrated) {
    return (
      <>
        <WallpaperBackdrop />
        <div className="relative z-10 grid min-h-dvh place-items-center">
          <p className="text-sm text-muted-foreground">Carregando a mesa…</p>
        </div>
      </>
    )
  }

  return (
    <BrowserRouter>
      <WallpaperBackdrop />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/novo" element={<NovoJogo />} />
          <Route path="/ferramentas" element={<Ferramentas />} />
          <Route path="/ferramentas/moeda" element={<MoedaPage />} />
          <Route path="/ferramentas/roleta" element={<RoletaPage />} />
          <Route path="/ferramentas/roleta-russa" element={<RoletaRussaPage />} />
          <Route path="/ferramentas/dados" element={<DadosPage />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
        <Route path="/jogo/:gameId/:sessionId" element={<Jogo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-center" closeButton />
    </BrowserRouter>
  )
}
