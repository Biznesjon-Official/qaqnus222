import type { Metadata, Viewport } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import SessionProvider from '@/components/SessionProvider'
import { ThemeProvider } from '@/components/ThemeContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ERP - Xo'jalik Mollari Do'koni",
  description: "Do'kon boshqaruv tizimi",
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "ERP Do'kon",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#DC2626',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                style: { fontFamily: 'Inter, sans-serif' },
              }}
            />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
