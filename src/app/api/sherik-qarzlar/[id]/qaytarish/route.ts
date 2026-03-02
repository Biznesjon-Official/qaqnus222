import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params
    // qaytarishlar: [{ tarkibId, miqdor }]
    const { qaytarishlar } = await req.json()

    const qarz = await prisma.sherikQarz.findUnique({
      where: { id },
      include: { tarkiblar: true },
    })
    if (!qarz) return NextResponse.json({ xato: 'Qarz topilmadi' }, { status: 404 })

    // Update each tarkib qaytarilgan
    for (const q of qaytarishlar as { tarkibId: string; miqdor: number }[]) {
      const tarkib = qarz.tarkiblar.find(t => t.id === q.tarkibId)
      if (!tarkib) continue
      const yangiQaytarilgan = Math.min(
        Number(tarkib.qaytarilgan) + q.miqdor,
        Number(tarkib.miqdor)
      )
      await prisma.sherikQarzTarkibi.update({
        where: { id: q.tarkibId },
        data: { qaytarilgan: yangiQaytarilgan },
      })
    }

    // Recalculate holati
    const yangilangan = await prisma.sherikQarz.findUnique({
      where: { id },
      include: { tarkiblar: true },
    })
    const hammasi = yangilangan!.tarkiblar
    const tolaYopilgan = hammasi.every(t => Number(t.qaytarilgan) >= Number(t.miqdor))
    const qismanYopilgan = hammasi.some(t => Number(t.qaytarilgan) > 0)

    const yangiHolat = tolaYopilgan ? 'YOPILGAN' : qismanYopilgan ? 'QISMAN' : 'OCHIQ'

    const natija = await prisma.sherikQarz.update({
      where: { id },
      data: { holati: yangiHolat },
      include: { tarkiblar: true },
    })

    return NextResponse.json(natija)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
