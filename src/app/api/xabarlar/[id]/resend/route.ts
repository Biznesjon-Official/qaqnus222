import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { xabarQaytaYuborish } from '@/lib/telegram'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params
    const natija = await xabarQaytaYuborish(id)
    return NextResponse.json(natija, { status: natija.ok ? 200 : 400 })
  } catch (e) {
    console.error('[Xabar resend]', e)
    return NextResponse.json({ ok: false, xato: 'Server xatosi' }, { status: 500 })
  }
}
