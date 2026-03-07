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
  title: 'Qaqnus 222',
  description: "Do'kon boshqaruv tizimi — Qaqnus 222",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Qaqnus 222',
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
