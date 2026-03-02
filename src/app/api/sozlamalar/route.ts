import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })
    const sozlamalar = await prisma.sozlama.findMany()
    const result: Record<string, string> = {}
    for (const s of sozlamalar) result[s.kalit] = s.qiymat
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })
    const data: Record<string, string> = await req.json()
    for (const [kalit, qiymat] of Object.entries(data)) {
      await prisma.sozlama.upsert({
        where: { kalit },
        update: { qiymat },
        create: { kalit, qiymat },
      })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
