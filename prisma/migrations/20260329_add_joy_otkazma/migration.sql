-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "Joylashuv" AS ENUM ('OMBOR', 'DOKON');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum - add OTKAZMA to HarakatTuri
ALTER TYPE "HarakatTuri" ADD VALUE IF NOT EXISTS 'OTKAZMA';

-- AlterTable - add joy column with default OMBOR
ALTER TABLE "ombor_harakati" ADD COLUMN IF NOT EXISTS "joy" "Joylashuv" NOT NULL DEFAULT 'OMBOR';

-- Mavjud CHIQIM (sotuv) harakatlarni DOKON ga o'tkazish
UPDATE "ombor_harakati" SET "joy" = 'DOKON' WHERE "turi" = 'CHIQIM' AND "sotuvId" IS NOT NULL;

-- Mavjud QAYTARISH harakatlarni DOKON ga o'tkazish
UPDATE "ombor_harakati" SET "joy" = 'DOKON' WHERE "turi" = 'QAYTARISH';
