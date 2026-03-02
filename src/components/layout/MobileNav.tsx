'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingCart, Package, Warehouse, BarChart3 } from 'lucide-react'

const mobileNavItems = [
  { href: '/', label: 'Bosh', icon: LayoutDashboard },
  { href: '/sotuv', label: 'Sotuv', icon: ShoppingCart },
  { href: '/tovarlar', label: 'Tovarlar', icon: Package },
  { href: '/ombor', label: 'Ombor', icon: Warehouse },
  { href: '/hisobotlar', label: 'Hisobot', icon: BarChart3 },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 z-40">
      <div className="flex items-center justify-around py-2 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[60px]',
                active ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
