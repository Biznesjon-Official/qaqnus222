import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST() {
  try {
    const session = await auth()
    const user = session?.user as { rol?: string } | undefined
    if (!session || user?.rol !== 'ADMIN') {
      return NextResponse.json({ xato: 'Faqat admin' }, { status: 403 })
    }

    // Delete in correct order (foreign key dependencies)
    await prisma.bildirishnomLog.deleteMany()
    await prisma.nasiyaTolov.deleteMany()
    await prisma.nasiya.deleteMany()
    await prisma.qaytarishTarkibi.deleteMany()
    await prisma.qaytarish.deleteMany()
    await prisma.sherikdanOlishTolov.deleteMany()
    await prisma.sherikdanOlish.deleteMany()
    await prisma.sherikQarzTarkibi.deleteMany()
    await prisma.sherikQarz.deleteMany()
    await prisma.sherikDokonTolov.deleteMany()
    await prisma.sotuvTarkibi.deleteMany()
    await prisma.omborHarakati.deleteMany()
    await prisma.sotuv.deleteMany()
    await prisma.xaridTolov.deleteMany()
    await prisma.xaridTarkibi.deleteMany()
    await prisma.xarid.deleteMany()
    await prisma.xarajat.deleteMany()
    await prisma.tovar.deleteMany()
    await prisma.kategoriya.deleteMany()
    await prisma.taminotchi.deleteMany()
    await prisma.mijoz.deleteMany()
    await prisma.sherikDokon.deleteMany()
    await prisma.sherik.deleteMany()
    await prisma.sozlama.deleteMany()
    // Foydalanuvchilar QOLADI

    return NextResponse.json({ muvaffaqiyat: true, xabar: "Ma'lumotlar bazasi tozalandi. Foydalanuvchilar saqlandi." })
  } catch (e) {
    console.error('[backup/clean] Error:', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
