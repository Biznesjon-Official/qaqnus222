-- Ta'minotchi qarz uchun: SherikdanOlish va SherikdanOlishTolov ga taminotchiId qo'shish
ALTER TABLE "sherikdan_olish" ALTER COLUMN "sherikId" DROP NOT NULL;
ALTER TABLE "sherikdan_olish" ADD COLUMN IF NOT EXISTS "taminotchiId" TEXT;
ALTER TABLE "sherikdan_olish"
  ADD CONSTRAINT "sherikdan_olish_taminotchiId_fkey"
  FOREIGN KEY ("taminotchiId") REFERENCES "taminotchilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sherikdan_olish_tolov" ALTER COLUMN "sherikId" DROP NOT NULL;
ALTER TABLE "sherikdan_olish_tolov" ADD COLUMN IF NOT EXISTS "taminotchiId" TEXT;
ALTER TABLE "sherikdan_olish_tolov"
  ADD CONSTRAINT "sherikdan_olish_tolov_taminotchiId_fkey"
  FOREIGN KEY ("taminotchiId") REFERENCES "taminotchilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
