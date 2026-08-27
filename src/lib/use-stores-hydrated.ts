import { useEffect, useState } from 'react'
import { useCanastraStore } from '@/games/canastra/store'
import { usePokerStore } from '@/games/poker/store'
import { useTrucoStore } from '@/games/truco/store'
import { useCoinStore } from '@/stores/coinStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUiStore } from '@/stores/uiStore'

function allHydrated() {
  return (
    useSessionStore.persist.hasHydrated() &&
    useCanastraStore.persist.hasHydrated() &&
    usePokerStore.persist.hasHydrated() &&
    useTrucoStore.persist.hasHydrated() &&
    useCoinStore.persist.hasHydrated() &&
    useRosterStore.persist.hasHydrated() &&
    useThemeStore.persist.hasHydrated() &&
    useUiStore.persist.hasHydrated()
  )
}

export function useStoresHydrated() {
  const [hydrated, setHydrated] = useState(allHydrated)

  useEffect(() => {
    if (allHydrated()) {
      setHydrated(true)
      return
    }
    const mark = () => {
      if (allHydrated()) setHydrated(true)
    }
    const unsubs = [
      useSessionStore.persist.onFinishHydration(mark),
      useCanastraStore.persist.onFinishHydration(mark),
      usePokerStore.persist.onFinishHydration(mark),
      useTrucoStore.persist.onFinishHydration(mark),
      useCoinStore.persist.onFinishHydration(mark),
      useRosterStore.persist.onFinishHydration(mark),
      useThemeStore.persist.onFinishHydration(mark),
      useUiStore.persist.onFinishHydration(mark),
    ]
    return () => {
      for (const unsub of unsubs) unsub()
    }
  }, [])

  return hydrated
}
