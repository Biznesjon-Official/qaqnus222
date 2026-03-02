-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'KASSIR', 'OMBORCHI');

-- CreateEnum
CREATE TYPE "Birlik" AS ENUM ('DONA', 'KG', 'LITR', 'METR', 'PACHKA', 'QUTI');

-- CreateEnum
CREATE TYPE "TovarHolati" AS ENUM ('FAOL', 'ARXIVLANGAN');

-- CreateEnum
CREATE TYPE "HarakatTuri" AS ENUM ('KIRIM', 'CHIQIM', 'QAYTARISH', 'YOQOTISH');

-- CreateEnum
CREATE TYPE "TolovUsuli" AS ENUM ('NAQD', 'KARTA', 'ARALASH', 'NASIYA');

-- CreateEnum
CREATE TYPE "SotuvHolati" AS ENUM ('YAKUNLANGAN', 'BEKOR_QILINGAN');

-- CreateEnum
CREATE TYPE "NasiyaHolati" AS ENUM ('OCHIQ', 'YOPILGAN', 'MUDDATI_OTGAN');

-- CreateEnum
CREATE TYPE "XarajatKategoriya" AS ENUM ('IJARA', 'MAOSH', 'TRANSPORT', 'KOMMUNAL', 'BOSHQA');

-- CreateTable
CREATE TABLE "foydalanuvchilar" (
    "id" TEXT NOT NULL,
    "ism" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "parolHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'KASSIR',
    "faol" BOOLEAN NOT NULL DEFAULT true,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yangilangan" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foydalanuvchilar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategoriyalar" (
    "id" TEXT NOT NULL,
    "nomi" TEXT NOT NULL,
    "tavsif" TEXT,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kategoriyalar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tovarlar" (
    "id" TEXT NOT NULL,
    "nomi" TEXT NOT NULL,
    "kategoriyaId" TEXT NOT NULL,
    "shtrixKod" TEXT,
    "kelishNarxi" DECIMAL(12,2) NOT NULL,
    "sotishNarxi" DECIMAL(12,2) NOT NULL,
    "birlik" "Birlik" NOT NULL DEFAULT 'DONA',
    "minimalQoldiq" INTEGER NOT NULL DEFAULT 5,
    "rasmUrl" TEXT,
    "holati" "TovarHolati" NOT NULL DEFAULT 'FAOL',
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yangilangan" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tovarlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ombor_harakati" (
    "id" TEXT NOT NULL,
    "tovarId" TEXT NOT NULL,
    "turi" "HarakatTuri" NOT NULL,
    "miqdor" DECIMAL(12,3) NOT NULL,
    "narx" DECIMAL(12,2) NOT NULL,
    "taminotchiId" TEXT,
    "sotuvId" TEXT,
    "izoh" TEXT,
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foydalanuvchiId" TEXT NOT NULL,

    CONSTRAINT "ombor_harakati_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mijozlar" (
    "id" TEXT NOT NULL,
    "ism" TEXT NOT NULL,
    "telefon" TEXT,
    "manzil" TEXT,
    "izoh" TEXT,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mijozlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sotuvlar" (
    "id" TEXT NOT NULL,
    "chekRaqami" TEXT NOT NULL,
    "mijozId" TEXT,
    "jamiSumma" DECIMAL(12,2) NOT NULL,
    "chegirma" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "yakuniySumma" DECIMAL(12,2) NOT NULL,
    "tolovUsuli" "TolovUsuli" NOT NULL DEFAULT 'NAQD',
    "naqdTolangan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "kartaTolangan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "kassirId" TEXT NOT NULL,
    "holati" "SotuvHolati" NOT NULL DEFAULT 'YAKUNLANGAN',
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sotuvlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sotuv_tarkibi" (
    "id" TEXT NOT NULL,
    "sotuvId" TEXT NOT NULL,
    "tovarId" TEXT NOT NULL,
    "miqdor" DECIMAL(12,3) NOT NULL,
    "birlikNarxi" DECIMAL(12,2) NOT NULL,
    "chegirma" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "jami" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sotuv_tarkibi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasiyalar" (
    "id" TEXT NOT NULL,
    "sotuvId" TEXT NOT NULL,
    "mijozId" TEXT NOT NULL,
    "jamiQarz" DECIMAL(12,2) NOT NULL,
    "tolangan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "qoldiq" DECIMAL(12,2) NOT NULL,
    "muddat" TIMESTAMP(3),
    "holati" "NasiyaHolati" NOT NULL DEFAULT 'OCHIQ',
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nasiyalar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasiya_tolovlar" (
    "id" TEXT NOT NULL,
    "nasiyaId" TEXT NOT NULL,
    "summa" DECIMAL(12,2) NOT NULL,
    "tolovUsuli" "TolovUsuli" NOT NULL DEFAULT 'NAQD',
    "qabulQiluvchiId" TEXT NOT NULL,
    "izoh" TEXT,
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nasiya_tolovlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taminotchilar" (
    "id" TEXT NOT NULL,
    "nomi" TEXT NOT NULL,
    "kontaktShaxs" TEXT,
    "telefon" TEXT,
    "manzil" TEXT,
    "izoh" TEXT,
    "yaratilgan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taminotchilar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xaridlar" (
    "id" TEXT NOT NULL,
    "taminotchiId" TEXT NOT NULL,
    "jamiSumma" DECIMAL(12,2) NOT NULL,
    "tolangan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "qoldiqQarz" DECIMAL(12,2) NOT NULL,
    "izoh" TEXT,
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foydalanuvchiId" TEXT NOT NULL,

    CONSTRAINT "xaridlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xarid_tarkibi" (
    "id" TEXT NOT NULL,
    "xaridId" TEXT NOT NULL,
    "tovarNomi" TEXT NOT NULL,
    "miqdor" DECIMAL(12,3) NOT NULL,
    "birlikNarxi" DECIMAL(12,2) NOT NULL,
    "jami" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "xarid_tarkibi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xarajatlar" (
    "id" TEXT NOT NULL,
    "kategoriya" "XarajatKategoriya" NOT NULL,
    "summa" DECIMAL(12,2) NOT NULL,
    "izoh" TEXT,
    "sana" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foydalanuvchiId" TEXT NOT NULL,

    CONSTRAINT "xarajatlar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foydalanuvchilar_login_key" ON "foydalanuvchilar"("login");

-- CreateIndex
CREATE UNIQUE INDEX "kategoriyalar_nomi_key" ON "kategoriyalar"("nomi");

-- CreateIndex
CREATE UNIQUE INDEX "tovarlar_shtrixKod_key" ON "tovarlar"("shtrixKod");

-- CreateIndex
CREATE UNIQUE INDEX "sotuvlar_chekRaqami_key" ON "sotuvlar"("chekRaqami");

-- CreateIndex
CREATE UNIQUE INDEX "nasiyalar_sotuvId_key" ON "nasiyalar"("sotuvId");

-- AddForeignKey
ALTER TABLE "tovarlar" ADD CONSTRAINT "tovarlar_kategoriyaId_fkey" FOREIGN KEY ("kategoriyaId") REFERENCES "kategoriyalar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ombor_harakati" ADD CONSTRAINT "ombor_harakati_tovarId_fkey" FOREIGN KEY ("tovarId") REFERENCES "tovarlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ombor_harakati" ADD CONSTRAINT "ombor_harakati_taminotchiId_fkey" FOREIGN KEY ("taminotchiId") REFERENCES "taminotchilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ombor_harakati" ADD CONSTRAINT "ombor_harakati_sotuvId_fkey" FOREIGN KEY ("sotuvId") REFERENCES "sotuvlar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ombor_harakati" ADD CONSTRAINT "ombor_harakati_foydalanuvchiId_fkey" FOREIGN KEY ("foydalanuvchiId") REFERENCES "foydalanuvchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sotuvlar" ADD CONSTRAINT "sotuvlar_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "mijozlar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sotuvlar" ADD CONSTRAINT "sotuvlar_kassirId_fkey" FOREIGN KEY ("kassirId") REFERENCES "foydalanuvchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sotuv_tarkibi" ADD CONSTRAINT "sotuv_tarkibi_sotuvId_fkey" FOREIGN KEY ("sotuvId") REFERENCES "sotuvlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sotuv_tarkibi" ADD CONSTRAINT "sotuv_tarkibi_tovarId_fkey" FOREIGN KEY ("tovarId") REFERENCES "tovarlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasiyalar" ADD CONSTRAINT "nasiyalar_sotuvId_fkey" FOREIGN KEY ("sotuvId") REFERENCES "sotuvlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasiyalar" ADD CONSTRAINT "nasiyalar_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "mijozlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasiya_tolovlar" ADD CONSTRAINT "nasiya_tolovlar_nasiyaId_fkey" FOREIGN KEY ("nasiyaId") REFERENCES "nasiyalar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasiya_tolovlar" ADD CONSTRAINT "nasiya_tolovlar_qabulQiluvchiId_fkey" FOREIGN KEY ("qabulQiluvchiId") REFERENCES "foydalanuvchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xaridlar" ADD CONSTRAINT "xaridlar_taminotchiId_fkey" FOREIGN KEY ("taminotchiId") REFERENCES "taminotchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xaridlar" ADD CONSTRAINT "xaridlar_foydalanuvchiId_fkey" FOREIGN KEY ("foydalanuvchiId") REFERENCES "foydalanuvchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xarid_tarkibi" ADD CONSTRAINT "xarid_tarkibi_xaridId_fkey" FOREIGN KEY ("xaridId") REFERENCES "xaridlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xarajatlar" ADD CONSTRAINT "xarajatlar_foydalanuvchiId_fkey" FOREIGN KEY ("foydalanuvchiId") REFERENCES "foydalanuvchilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
