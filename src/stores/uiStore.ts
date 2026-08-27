import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UiState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'pontos-ui', version: 1 },
  ),
)
