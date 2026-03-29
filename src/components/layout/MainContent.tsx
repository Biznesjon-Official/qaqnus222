'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const rol = (session?.user as any)?.rol

  useEffect(() => {
    if (status === 'authenticated' && rol === 'SOTUVCHI' && pathname !== '/sotuvchi') {
      router.replace('/sotuvchi')
    }
  }, [status, rol, pathname])

  const isSotuvchi = rol === 'SOTUVCHI'

  return (
    <main className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-colors duration-200 ${isSotuvchi ? 'pb-4 lg:pb-6' : 'pb-20 lg:pb-6'}`}>
      {children}
    </main>
  )
}
