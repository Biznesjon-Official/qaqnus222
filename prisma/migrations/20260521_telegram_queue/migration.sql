-- BildirishnomLog: queue worker uchun yangi maydonlar (max attempts + next retry)
ALTER TABLE "bildirishnom_loglar" ADD COLUMN IF NOT EXISTS "maxUrinish" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "bildirishnom_loglar" ADD COLUMN IF NOT EXISTS "keyingiUrinish" TIMESTAMP(3);

-- Queue worker uchun index: status + keyingiUrinish bo'yicha tezkor qidirish
CREATE INDEX IF NOT EXISTS "bildirishnom_loglar_status_keyingiUrinish_idx"
  ON "bildirishnom_loglar"("status", "keyingiUrinish");

-- Eski 3 soatlik PEER_FLOOD timer'ni o'chirish (yangi 24 soatli logika ishlasin)
DELETE FROM "sozlamalar" WHERE "kalit" = 'telegram_flood_until';
