import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params
    const { summa, izoh } = await req.json()

    if (!summa || parseFloat(summa) <= 0) return NextResponse.json({ xato: "Summa noto'g'ri" }, { status: 400 })

    const tolov = await prisma.sherikDokonTolov.create({
      data: { sherikDokonId: id, summa: parseFloat(summa), izoh: izoh || null },
    })

    return NextResponse.json(tolov, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
