/*
  Warnings:

  - A unique constraint covering the columns `[maxsus_kod]` on the table `mijozlar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telegram_id]` on the table `mijozlar` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SherikQarzHolati" AS ENUM ('OCHIQ', 'QISMAN', 'YOPILGAN');

-- AlterEnum
ALTER TYPE "TolovUsuli" ADD VALUE 'SHERIK';

-- AlterTable
ALTER TABLE "foydalanuvchilar" ADD COLUMN     "telefon" TEXT;

-- AlterTable
ALTER TABLE "mijozlar" ADD COLUMN     "maxsus_kod" TEXT,
ADD COLUMN     "telegram_id" TEXT;

-- AlterTable
ALTER TABLE "sotuvlar" ADD COLUMN     "sherikDokonId" TEXT;

-- CreateTable
CREATE TABLE "xarid_tolovlar" (
    "id" TEXT NOT NULL,
    "xaridId" TEXT NOT NULL,
    "summa" DECIMAL(12,2) NOT NULL,
    "tolovUsuli" "TolovUsuli" NOT NULL DEFAULT 'NAQD',
    "qabulQiluvchiId" TEXT NOT NULL,
    "izoh" TEXT,
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xarid_tolovlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sozlamalar" (
    "id" TEXT NOT NULL,
    "kalit" TEXT NOT NULL,
    "qiymat" TEXT NOT NULL,
    "yangilangan" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sozlamalar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sherik_dokonlar" (
    "id" TEXT NOT NULL,
    "nomi" TEXT NOT NULL,
    "telefon" TEXT,
    "manzil" TEXT,
    "izoh" TEXT,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sherik_dokonlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sherik_dokon_tolovlar" (
    "id" TEXT NOT NULL,
    "sherikDokonId" TEXT NOT NULL,
    "summa" DECIMAL(12,2) NOT NULL,
    "izoh" TEXT,
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sherik_dokon_tolovlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheriklar" (
    "id" TEXT NOT NULL,
    "ism" TEXT NOT NULL,
    "telefon" TEXT,
    "telefon2" TEXT,
    "manzil" TEXT,
    "tavsif" TEXT,
    "faol" BOOLEAN NOT NULL DEFAULT true,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sheriklar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sherik_qarzlar" (
    "id" TEXT NOT NULL,
    "sherikId" TEXT NOT NULL,
    "izoh" TEXT,
    "holati" "SherikQarzHolati" NOT NULL DEFAULT 'OCHIQ',
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sherik_qarzlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sherikdan_olish" (
    "id" TEXT NOT NULL,
    "sotuvId" TEXT NOT NULL,
    "sherikId" TEXT NOT NULL,
    "tovarId" TEXT NOT NULL,
    "miqdor" DECIMAL(12,3) NOT NULL,
    "narx" DECIMAL(12,2) NOT NULL,
    "jami" DECIMAL(12,2) NOT NULL,
    "izoh" TEXT,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sherikdan_olish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sherikdan_olish_tolov" (
    "id" TEXT NOT NULL,
    "sherikdanOlishId" TEXT,
    "sherikId" TEXT NOT NULL,
    "summa" DECIMAL(12,2) NOT NULL,
    "turi" TEXT NOT NULL,
    "izoh" TEXT,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sherikdan_olish_tolov_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sherik_qarz_tarkibi" (
    "id" TEXT NOT NULL,
    "sherikQarzId" TEXT NOT NULL,
    "tovarNomi" TEXT NOT NULL,
    "miqdor" DECIMAL(12,3) NOT NULL,
    "birlik" TEXT NOT NULL DEFAULT 'dona',
    "qaytarilgan" DECIMAL(12,3) NOT NULL DEFAULT 0,

    CONSTRAINT "sherik_qarz_tarkibi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qaytarishlar" (
    "id" TEXT NOT NULL,
    "aslSotuvId" TEXT NOT NULL,
    "kassirId" TEXT NOT NULL,
    "jamiSumma" DECIMAL(12,2) NOT NULL,
    "sabab" TEXT,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qaytarishlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qaytarish_tarkibi" (
    "id" TEXT NOT NULL,
    "qaytarishId" TEXT NOT NULL,
    "tovarId" TEXT NOT NULL,
    "miqdor" DECIMAL(12,3) NOT NULL,
    "birlikNarxi" DECIMAL(12,2) NOT NULL,
    "jami" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "qaytarish_tarkibi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bildirishnom_loglar" (
    "id" TEXT NOT NULL,
    "nasiyaId" TEXT NOT NULL,
    "mijozId" TEXT NOT NULL,
    "xabarTuri" TEXT NOT NULL,
    "yuborildi" BOOLEAN NOT NULL DEFAULT false,
    "xato" TEXT,
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bildirishnom_loglar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sozlamalar_kalit_key" ON "sozlamalar"("kalit");

-- CreateIndex
CREATE UNIQUE INDEX "mijozlar_maxsus_kod_key" ON "mijozlar"("maxsus_kod");

-- CreateIndex
CREATE UNIQUE INDEX "mijozlar_telegram_id_key" ON "mijozlar"("telegram_id");

-- AddForeignKey
ALTER TABLE "sotuvlar" ADD CONSTRAINT "sotuvlar_sherikDokonId_fkey" FOREIGN KEY ("sherikDokonId") REFERENCES "sherik_dokonlar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xarid_tolovlar" ADD CONSTRAINT "xarid_tolovlar_xaridId_fkey" FOREIGN KEY ("xaridId") REFERENCES "xaridlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xarid_tolovlar" ADD CONSTRAINT "xarid_tolovlar_qabulQiluvchiId_fkey" FOREIGN KEY ("qabulQiluvchiId") REFERENCES "foydalanuvchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherik_dokon_tolovlar" ADD CONSTRAINT "sherik_dokon_tolovlar_sherikDokonId_fkey" FOREIGN KEY ("sherikDokonId") REFERENCES "sherik_dokonlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherik_qarzlar" ADD CONSTRAINT "sherik_qarzlar_sherikId_fkey" FOREIGN KEY ("sherikId") REFERENCES "sheriklar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherikdan_olish" ADD CONSTRAINT "sherikdan_olish_sotuvId_fkey" FOREIGN KEY ("sotuvId") REFERENCES "sotuvlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherikdan_olish" ADD CONSTRAINT "sherikdan_olish_sherikId_fkey" FOREIGN KEY ("sherikId") REFERENCES "sheriklar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherikdan_olish" ADD CONSTRAINT "sherikdan_olish_tovarId_fkey" FOREIGN KEY ("tovarId") REFERENCES "tovarlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherikdan_olish_tolov" ADD CONSTRAINT "sherikdan_olish_tolov_sherikdanOlishId_fkey" FOREIGN KEY ("sherikdanOlishId") REFERENCES "sherikdan_olish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherikdan_olish_tolov" ADD CONSTRAINT "sherikdan_olish_tolov_sherikId_fkey" FOREIGN KEY ("sherikId") REFERENCES "sheriklar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sherik_qarz_tarkibi" ADD CONSTRAINT "sherik_qarz_tarkibi_sherikQarzId_fkey" FOREIGN KEY ("sherikQarzId") REFERENCES "sherik_qarzlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qaytarishlar" ADD CONSTRAINT "qaytarishlar_aslSotuvId_fkey" FOREIGN KEY ("aslSotuvId") REFERENCES "sotuvlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qaytarishlar" ADD CONSTRAINT "qaytarishlar_kassirId_fkey" FOREIGN KEY ("kassirId") REFERENCES "foydalanuvchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qaytarish_tarkibi" ADD CONSTRAINT "qaytarish_tarkibi_qaytarishId_fkey" FOREIGN KEY ("qaytarishId") REFERENCES "qaytarishlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qaytarish_tarkibi" ADD CONSTRAINT "qaytarish_tarkibi_tovarId_fkey" FOREIGN KEY ("tovarId") REFERENCES "tovarlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bildirishnom_loglar" ADD CONSTRAINT "bildirishnom_loglar_nasiyaId_fkey" FOREIGN KEY ("nasiyaId") REFERENCES "nasiyalar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bildirishnom_loglar" ADD CONSTRAINT "bildirishnom_loglar_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "mijozlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
