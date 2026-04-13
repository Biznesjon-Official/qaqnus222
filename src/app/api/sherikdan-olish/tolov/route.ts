import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const data = await req.json()
    const { sherikdanOlishId, sherikId, taminotchiId, summa, turi, izoh } = data

    if ((!sherikId && !taminotchiId) || !summa || !turi) {
      return NextResponse.json({ xato: 'kontragent, summa va turi kerak' }, { status: 400 })
    }

    const tolov = await prisma.sherikdanOlishTolov.create({
      data: {
        sherikdanOlishId: sherikdanOlishId || null,
        sherikId: sherikId || null,
        taminotchiId: taminotchiId || null,
        summa: parseFloat(summa),
        turi, // "PUL" | "TOVAR"
        izoh: izoh || null,
      },
    })

    return NextResponse.json(tolov, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
