'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/SidebarContext'
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  Users, CreditCard, Truck, Receipt, BarChart3, Settings,
  X, Store, ChevronLeft, ChevronRight, ShoppingBag, Users2, Building2, Handshake,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/sotuv', label: 'Sotuv (POS)', icon: ShoppingCart },
  { href: '/tovarlar', label: 'Tovarlar', icon: Package },
  { href: '/ombor', label: 'Ombor', icon: Warehouse },
  { href: '/mijozlar', label: 'Mijozlar', icon: Users },
  { href: '/nasiyalar', label: 'Nasiyalar', icon: CreditCard },
  { href: '/taminotchilar', label: "Ta'minotchilar", icon: Truck },
  { href: '/xaridlar', label: 'Xaridlar', icon: ShoppingBag },
  { href: '/xarajatlar', label: 'Xarajatlar', icon: Receipt },
  { href: '/sheriklar', label: 'Sheriklar', icon: Building2 },
  { href: '/sherikdan-olish', label: 'Sherikdan olish', icon: Handshake },
  { href: '/agentlar', label: 'Agentlar', icon: Users2 },
  { href: '/hisobotlar', label: 'Hisobotlar', icon: BarChart3 },
  { href: '/sozlamalar', label: 'Sozlamalar', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen, collapsed, toggleCollapsed } = useSidebar()
  const [dokonNomi, setDokonNomi] = useState('Optimum')
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol

  const visibleItems = rol === 'KASSIR'
    ? navItems.filter(item => item.href === '/sotuv' || item.href === '/hisobotlar')
    : navItems

  useEffect(() => {
    fetch('/api/sozlamalar')
      .then(r => r.json())
      .then(data => { if (data?.dokon_nomi) setDokonNomi(data.dokon_nomi) })
      .catch(() => {})
  }, [])

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full bg-white dark:bg-neutral-950 border-r border-gray-200 dark:border-neutral-800 z-50 flex flex-col transition-all duration-300 overflow-hidden',
        'lg:static lg:z-auto lg:h-auto lg:min-h-screen',
        'w-64 shrink-0',
        collapsed ? 'lg:w-16' : 'lg:w-64',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>

        {/* Logo */}
        <div className="h-16 flex items-center border-b border-gray-200 dark:border-neutral-800 shrink-0">
          <div className={cn(
            'flex items-center px-3 flex-1 min-w-0 gap-2.5',
            collapsed && 'lg:justify-center lg:px-0 lg:gap-0'
          )}>
            {/* Kengaytirilgan holat: qizil icon + Bebas Neue nomi */}
            <div className={cn('flex items-center gap-2.5 min-w-0 flex-1', collapsed && 'lg:hidden')}>
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
                <Store size={19} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="block text-gray-900 dark:text-gray-100 truncate leading-none"
                  style={{ fontFamily: 'var(--font-bebas)', fontSize: 20, letterSpacing: '0.04em' }}
                >
                  {dokonNomi.toUpperCase()}
                </span>
                <span className="text-gray-400 dark:text-gray-600 text-[10px] leading-none">Boshqaruv tizimi</span>
              </div>
            </div>
            {/* Yig'ilgan holat (faqat desktop): Store ikonkasi */}
            <div className={cn(
              'w-9 h-9 bg-red-600 rounded-xl items-center justify-center shrink-0 shadow-md shadow-red-600/30',
              collapsed ? 'lg:flex hidden' : 'hidden'
            )}>
              <Store size={19} className="text-white" />
            </div>
          </div>
          {/* Mobil: yopish tugmasi */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden mr-3 shrink-0 p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                  collapsed ? 'lg:justify-center lg:gap-0 lg:px-0 lg:py-2.5 px-3 py-2.5' : 'px-3 py-2.5',
                  active
                    ? cn(
                        'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
                        collapsed
                          ? 'border-l-[3px] border-red-600 dark:border-red-500 pl-[9px] lg:border-0 lg:pl-0'
                          : 'border-l-[3px] border-red-600 dark:border-red-500 pl-[9px]'
                      )
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800'
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    'shrink-0',
                    active ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'
                  )}
                />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          'border-t border-gray-200 dark:border-neutral-800 shrink-0 flex items-center py-3',
          collapsed ? 'lg:justify-center lg:px-2 px-4 justify-between' : 'px-4 justify-between'
        )}>
          <p className={cn('text-gray-400 dark:text-gray-600 text-[11px]', collapsed && 'lg:hidden')}>
            v1.0.0
          </p>
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
            title={collapsed ? "Kengaytirish" : "Yig'ish"}
            aria-label={collapsed ? "Kengaytirish" : "Yig'ish"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

      </aside>
    </>
  )
}
