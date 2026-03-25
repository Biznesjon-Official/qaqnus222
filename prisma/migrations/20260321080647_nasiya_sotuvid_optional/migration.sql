-- DropForeignKey
ALTER TABLE "nasiyalar" DROP CONSTRAINT "nasiyalar_sotuvId_fkey";

-- AlterTable
ALTER TABLE "nasiyalar" ALTER COLUMN "sotuvId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "nasiyalar" ADD CONSTRAINT "nasiyalar_sotuvId_fkey" FOREIGN KEY ("sotuvId") REFERENCES "sotuvlar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
