'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface SidebarCtx {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
  collapsed: boolean
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarCtx>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  collapsed: false,
  toggleCollapsed: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{
      open, setOpen,
      toggle: () => setOpen(p => !p),
      collapsed, toggleCollapsed,
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
