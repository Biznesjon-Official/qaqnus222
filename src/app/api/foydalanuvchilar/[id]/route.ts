import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || (session.user as any)?.rol !== 'ADMIN') {
      return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 403 })
    }
    const { ism, rol, parol, faol, telefon } = await req.json()
    const updateData: any = { ism, rol, faol, telefon: telefon || null }
    if (parol) updateData.parolHash = await bcrypt.hash(parol, 10)
    const user = await prisma.foydalanuvchi.update({
      where: { id },
      data: updateData,
      select: { id: true, ism: true, login: true, rol: true, faol: true, telefon: true },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || (session.user as any)?.rol !== 'ADMIN') {
      return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 403 })
    }
    await prisma.foydalanuvchi.update({ where: { id }, data: { faol: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
