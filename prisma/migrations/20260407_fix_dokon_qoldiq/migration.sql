-- Fix: boshlang'ich qoldiq va qoldiq sozlash yozuvlari DOKON bo'lishi kerak
-- Chunki dokon qoldig'i = dokonQoldiq hisoblanadi

-- 1. Boshlang'ich qoldiq yozuvlari
UPDATE "ombor_harakati"
SET "joy" = 'DOKON'
WHERE "turi" = 'KIRIM'
  AND "joy" = 'OMBOR'
  AND "izoh" = 'Boshlang''ich qoldiq';

-- 2. Qoldiq sozlash yozuvlari
UPDATE "ombor_harakati"
SET "joy" = 'DOKON'
WHERE "turi" IN ('KIRIM', 'YOQOTISH')
  AND "joy" = 'OMBOR'
  AND "izoh" LIKE 'Qoldiq sozlash:%';
