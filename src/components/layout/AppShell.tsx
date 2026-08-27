import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { SideNav } from '@/components/layout/SideNav'

export function AppShell() {
  return (
    <div className="relative z-10 flex min-h-dvh">
      <SideNav />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
