-- Valyuta enum (USD/UZS) va Xarid.valyuta maydoni
-- Default: UZS — eski yozuvlar avtomatik UZS bo'ladi

DO $$ BEGIN
  CREATE TYPE "Valyuta" AS ENUM ('UZS', 'USD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "xaridlar" ADD COLUMN IF NOT EXISTS "valyuta" "Valyuta" NOT NULL DEFAULT 'UZS';

CREATE INDEX IF NOT EXISTS "xaridlar_taminotchiId_valyuta_idx" ON "xaridlar"("taminotchiId", "valyuta");
