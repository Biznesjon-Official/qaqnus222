-- AlterTable
ALTER TABLE "buyurtmalar" ADD COLUMN IF NOT EXISTS "mijozId" TEXT;

-- AddForeignKey
ALTER TABLE "buyurtmalar" ADD CONSTRAINT "buyurtmalar_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "mijozlar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
