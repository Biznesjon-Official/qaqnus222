import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')))
    const status = searchParams.get('status') || ''
    const xabarTuri = searchParams.get('xabarTuri') || ''
    const mijozIsm = searchParams.get('mijozIsm') || ''

    const where: any = {}
    if (status) where.status = status
    if (xabarTuri) where.xabarTuri = xabarTuri
    if (mijozIsm) where.mijoz = { ism: { contains: mijozIsm, mode: 'insensitive' } }

    const [jami, xabarlar] = await Promise.all([
      prisma.bildirishnomLog.count({ where }),
      prisma.bildirishnomLog.findMany({
        where,
        include: {
          mijoz: { select: { id: true, ism: true, telefon: true } },
          nasiya: { select: { id: true, jamiQarz: true, qoldiq: true, holati: true } },
        },
        orderBy: { sana: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    // Statistikalar
    const statistika = await prisma.bildirishnomLog.groupBy({
      by: ['status'],
      _count: true,
    })

    const stats = {
      sent: 0,
      failed: 0,
      pending: 0,
      jami: 0,
    }
    for (const s of statistika) {
      if (s.status === 'sent') stats.sent = s._count
      else if (s.status === 'failed') stats.failed = s._count
      else if (s.status === 'pending') stats.pending = s._count
      stats.jami += s._count
    }

    return NextResponse.json({
      xabarlar,
      stats,
      pagination: {
        page,
        limit,
        jami,
        sahifalar: Math.ceil(jami / limit),
      },
    })
  } catch (e) {
    console.error('[Xabarlar GET]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
