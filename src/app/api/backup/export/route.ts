import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/backup/export
// Downloads a full JSON backup of all database tables.
// Restricted to ADMIN role only.
export async function GET() {
  try {
    const session = await auth()
    const user = session?.user as { rol?: string } | undefined

    if (!session || user?.rol !== 'ADMIN') {
      return NextResponse.json({ xato: 'Faqat admin' }, { status: 403 })
    }

    // Fetch all tables in parallel for performance
    const [
      tovarlar,
      kategoriyalar,
      mijozlar,
      taminotchilar,
      sotuvlar,
      nasiyalar,
      nasiyaTolovlar,
      xaridlar,
      xarajatlar,
      omborHarakatlari,
      sozlamalar,
      foydalanuvchilar,
    ] = await Promise.all([
      prisma.tovar.findMany(),
      prisma.kategoriya.findMany(),
      prisma.mijoz.findMany(),
      prisma.taminotchi.findMany(),
      prisma.sotuv.findMany({ include: { tarkiblar: true } }),
      prisma.nasiya.findMany(),
      prisma.nasiyaTolov.findMany(),
      prisma.xarid.findMany({ include: { tarkiblar: true } }),
      prisma.xarajat.findMany(),
      prisma.omborHarakati.findMany(),
      prisma.sozlama.findMany(),
      // Exclude parolHash from backup for security
      prisma.foydalanuvchi.findMany({
        select: {
          id: true,
          ism: true,
          login: true,
          rol: true,
          faol: true,
          yaratilgan: true,
        },
      }),
    ])

    const backup = {
      version: '1.0',
      sana: new Date().toISOString(),
      tovarlar,
      kategoriyalar,
      mijozlar,
      taminotchilar,
      // sotuvlar includes tarkiblar (SotuvTarkibi[]) via Prisma include
      sotuvlar,
      nasiyalar,
      nasiyaTolovlar,
      // xaridlar includes tarkiblar (XaridTarkibi[]) via Prisma include
      xaridlar,
      xarajatlar,
      omborHarakatlari,
      sozlamalar,
      foydalanuvchilar,
      statistika: {
        tovarlarSoni: tovarlar.length,
        mijozlarSoni: mijozlar.length,
        taminotchilarSoni: taminotchilar.length,
        sotuvlarSoni: sotuvlar.length,
        nasiyalarSoni: nasiyalar.length,
        xarajatlarSoni: xarajatlar.length,
      },
    }

    const filename = `erp_backup_${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    console.error('[backup/export] Error:', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
