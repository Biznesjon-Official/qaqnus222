import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const sherikdanOlishlar = await prisma.sherikdanOlish.findMany({
      include: {
        sherik: { select: { id: true, ism: true, telefon: true } },
        tovar: { select: { id: true, nomi: true, birlik: true } },
        sotuv: { select: { id: true, chekRaqami: true, sana: true } },
        tolovlar: true,
      },
      orderBy: { yaratilgan: 'desc' },
    })

    // Sherik bo'yicha guruhlash
    const sherikMap: Record<string, {
      sherik: { id: string; ism: string; telefon: string | null }
      olishlar: typeof sherikdanOlishlar
      jamiQarz: number
      tolangan: number
      qoldiq: number
    }> = {}

    for (const item of sherikdanOlishlar) {
      const sid = item.sherikId
      if (!sherikMap[sid]) {
        sherikMap[sid] = {
          sherik: item.sherik,
          olishlar: [],
          jamiQarz: 0,
          tolangan: 0,
          qoldiq: 0,
        }
      }
      sherikMap[sid].olishlar.push(item)
      sherikMap[sid].jamiQarz += Number(item.jami)
      const itemTolangan = item.tolovlar.reduce((s, t) => s + Number(t.summa), 0)
      sherikMap[sid].tolangan += itemTolangan
    }

    for (const sid in sherikMap) {
      sherikMap[sid].qoldiq = sherikMap[sid].jamiQarz - sherikMap[sid].tolangan
    }

    return NextResponse.json(Object.values(sherikMap))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const data = await req.json()
    const { id, sherikId, miqdor } = data

    if (!id) return NextResponse.json({ xato: 'ID kerak' }, { status: 400 })

    const updateData: any = {}
    if (sherikId) updateData.sherikId = sherikId
    if (miqdor !== undefined) {
      updateData.miqdor = parseFloat(miqdor)
      const existing = await prisma.sherikdanOlish.findUnique({ where: { id } })
      if (existing) {
        updateData.jami = parseFloat(miqdor) * Number(existing.narx)
      }
    }

    const updated = await prisma.sherikdanOlish.update({
      where: { id },
      data: updateData,
      include: {
        sherik: { select: { ism: true } },
        tovar: { select: { nomi: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
