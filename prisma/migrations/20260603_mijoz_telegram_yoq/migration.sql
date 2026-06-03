-- Mijoz.telegramYoq — Telegramda topilmagan mijozlarni belgilash (qayta urinmaslik)
ALTER TABLE "mijozlar" ADD COLUMN IF NOT EXISTS "telegramYoq" BOOLEAN NOT NULL DEFAULT false;

-- Mavjud Telegram'da topilmagan mijozlarni belgilash
-- (oxirgi 7 kun davomida kamida 2 marta 'Telegram yo'q' xatosi bo'lganlar)
UPDATE "mijozlar" m
SET "telegramYoq" = true
WHERE m.id IN (
  SELECT "mijozId"
  FROM "bildirishnom_loglar"
  WHERE status = 'failed'
    AND (
      xato LIKE '%raqami Telegramda topilmadi%'
      OR xato LIKE '%PHONE_NOT_OCCUPIED%'
      OR xato LIKE '%ro''yxatdan o''tmagan%'
    )
    AND sana >= NOW() - INTERVAL '30 days'
  GROUP BY "mijozId"
  HAVING COUNT(*) >= 2
);
