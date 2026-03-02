import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// KASSIR faqat bu yo'llarga kira oladi
const KASSIR_RUXSAT = [
  '/sotuv',
  '/hisobotlar',
  '/api/sotuvlar',
  '/api/hisobotlar',
  '/api/tovarlar',
  '/api/mijozlar',
  '/api/sozlamalar',
  '/api/auth',
]

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Login sahifasi va API auth — ochiq
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Tizimga kirmaganlar — login sahifasiga
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // KASSIR cheklovi
  const rol = (req.auth.user as any)?.rol
  if (rol === 'KASSIR') {
    const ruxsatBor = KASSIR_RUXSAT.some(p => pathname.startsWith(p))
    if (!ruxsatBor) {
      return NextResponse.redirect(new URL('/sotuv', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}
