import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/xaridlar/summary
 *
 * Per-currency qoldiq qarz summalari.
 * Aralashtirilmaydi — har valyuta alohida.
 *
 * Response: { uzsQarz: number, usdQarz: number }
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const [uzs, usd] = await Promise.all([
      prisma.xarid.aggregate({
        where: { valyuta: 'UZS', qoldiqQarz: { gt: 0 } },
        _sum: { qoldiqQarz: true },
      }),
      prisma.xarid.aggregate({
        where: { valyuta: 'USD', qoldiqQarz: { gt: 0 } },
        _sum: { qoldiqQarz: true },
      }),
    ])

    return NextResponse.json({
      uzsQarz: Number(uzs._sum.qoldiqQarz || 0),
      usdQarz: Number(usd._sum.qoldiqQarz || 0),
    })
  } catch (e) {
    console.error('[Xaridlar summary GET]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
