'use client'

import { useSidebar } from '@/components/SidebarContext'
import { cn } from '@/lib/utils'

export default function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className={cn(
      'flex flex-col h-full overflow-hidden transition-all duration-300',
      collapsed ? 'lg:ml-16' : 'lg:ml-64',
    )}>
      {children}
    </div>
  )
}
