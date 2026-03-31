const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const harakatlar = await prisma.omborHarakati.findMany({
    select: { tovarId: true, turi: true, miqdor: true, joy: true }
  });

  const omborQoldiq = {};
  for (const h of harakatlar) {
    if (h.joy === 'DOKON') continue;
    if (!omborQoldiq[h.tovarId]) omborQoldiq[h.tovarId] = 0;
    if (h.turi === 'KIRIM' || h.turi === 'QAYTARISH') omborQoldiq[h.tovarId] += Number(h.miqdor);
    else if (h.turi === 'OTKAZMA') omborQoldiq[h.tovarId] -= Number(h.miqdor);
    else omborQoldiq[h.tovarId] -= Number(h.miqdor);
  }

  const admin = await prisma.foydalanuvchi.findFirst({ where: { rol: 'ADMIN' } });
  let soni = 0;

  for (const [tovarId, qoldiq] of Object.entries(omborQoldiq)) {
    if (qoldiq > 0.001) {
      await prisma.omborHarakati.create({
        data: {
          tovarId,
          turi: 'YOQOTISH',
          joy: 'OMBOR',
          miqdor: qoldiq,
          narx: 0,
          izoh: 'Ombor tozalash',
          foydalanuvchiId: admin.id,
        }
      });
      soni++;
    }
  }

  console.log(soni + ' ta tovar ombor qoldiqi 0 ga tushirildi');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
