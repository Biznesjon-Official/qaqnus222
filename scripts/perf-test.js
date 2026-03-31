const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Cold start
  let s = Date.now();
  await prisma.tovar.count();
  console.log("Prisma cold start:", Date.now() - s, "ms");

  // Tovarlar query
  s = Date.now();
  const tovarlar = await prisma.tovar.findMany({
    where: { holati: "FAOL" },
    include: { kategoriya: true },
    orderBy: { nomi: "asc" },
  });
  console.log("Tovarlar (warm):", Date.now() - s, "ms —", tovarlar.length, "products");

  // Stock aggregate
  s = Date.now();
  const stock = await prisma.$queryRawUnsafe(
    `SELECT "tovarId",
      COALESCE(SUM(CASE WHEN joy='DOKON' THEN 0 WHEN turi='KIRIM' OR turi='QAYTARISH' THEN miqdor WHEN turi='OTKAZMA' THEN -miqdor ELSE -miqdor END),0)::float AS "omborQoldiq",
      COALESCE(SUM(CASE WHEN turi='OTKAZMA' THEN miqdor WHEN joy!='DOKON' THEN 0 WHEN turi='KIRIM' OR turi='QAYTARISH' THEN miqdor ELSE -miqdor END),0)::float AS "dokonQoldiq"
    FROM ombor_harakati GROUP BY "tovarId"`
  );
  console.log("Stock aggregate:", Date.now() - s, "ms —", stock.length, "rows");

  // Full ombor simulation (both queries)
  s = Date.now();
  await Promise.all([
    prisma.tovar.findMany({ where: { holati: "FAOL" }, include: { kategoriya: true }, orderBy: { nomi: "asc" } }),
    prisma.$queryRawUnsafe(`SELECT "tovarId", COALESCE(SUM(CASE WHEN joy='DOKON' THEN 0 WHEN turi='KIRIM' OR turi='QAYTARISH' THEN miqdor WHEN turi='OTKAZMA' THEN -miqdor ELSE -miqdor END),0)::float AS "omborQoldiq", COALESCE(SUM(CASE WHEN turi='OTKAZMA' THEN miqdor WHEN joy!='DOKON' THEN 0 WHEN turi='KIRIM' OR turi='QAYTARISH' THEN miqdor ELSE -miqdor END),0)::float AS "dokonQoldiq" FROM ombor_harakati GROUP BY "tovarId"`)
  ]);
  console.log("Full ombor (parallel):", Date.now() - s, "ms");

  // OLD method — include omborHarakati
  s = Date.now();
  await prisma.tovar.findMany({
    where: { holati: "FAOL" },
    include: { kategoriya: true, omborHarakati: { select: { miqdor: true, turi: true, joy: true } } },
    orderBy: { nomi: "asc" },
  });
  console.log("OLD method (include omborHarakati):", Date.now() - s, "ms");

  await prisma.$disconnect();
  await pool.end();
}
test();
