import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const tovar = await prisma.tovar.findUnique({
      where: { id },
      include: {
        kategoriya: true,
        omborHarakati: {
          include: { foydalanuvchi: { select: { ism: true } } },
          orderBy: { sana: 'desc' },
          take: 20,
        },
      },
    })
    if (!tovar) return NextResponse.json({ xato: 'Topilmadi' }, { status: 404 })
    return NextResponse.json(tovar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const data = await req.json()
    const tovar = await prisma.tovar.update({
      where: { id },
      data: {
        nomi: data.nomi,
        kategoriyaId: data.kategoriyaId,
        shtrixKod: data.shtrixKod || null,
        kelishNarxi: parseFloat(data.kelishNarxi),
        sotishNarxi: parseFloat(data.sotishNarxi),
        birlik: data.birlik,
        minimalQoldiq: parseInt(data.minimalQoldiq),
        rasmUrl: data.rasmUrl || null,
      },
      include: { kategoriya: true },
    })
    return NextResponse.json(tovar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const tovar = await prisma.tovar.update({
      where: { id },
      data: { holati: 'ARXIVLANGAN' },
    })
    return NextResponse.json(tovar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
