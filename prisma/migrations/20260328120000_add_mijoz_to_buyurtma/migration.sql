-- AlterTable
ALTER TABLE "buyurtmalar" ADD COLUMN IF NOT EXISTS "mijozId" TEXT;

-- AddForeignKey (skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buyurtmalar_mijozId_fkey'
  ) THEN
    ALTER TABLE "buyurtmalar" ADD CONSTRAINT "buyurtmalar_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "mijozlar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
