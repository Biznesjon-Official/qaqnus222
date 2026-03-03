import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function clean() {
  console.log('DB tozalash boshlandi...')

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

  const users = await prisma.foydalanuvchi.findMany({ select: { login: true, rol: true } })
  console.log('\nQolgan foydalanuvchilar:')
  users.forEach(u => console.log(`  ${u.login} (${u.rol})`))
  console.log('\nDB tozalandi! Foydalanuvchilar saqlandi.')
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
