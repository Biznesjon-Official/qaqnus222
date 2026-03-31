-- Performance indexes for stock calculation queries

-- OmborHarakati: tovarId index (CRITICAL — used in every stock query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ombor_harakati_tovarId_idx" ON "ombor_harakati" ("tovarId");

-- OmborHarakati: compound index for stock aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ombor_harakati_tovar_turi_joy_idx" ON "ombor_harakati" ("tovarId", "turi", "joy");

-- Tovar: holati index (filtered in every API call)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "tovarlar_holati_idx" ON "tovarlar" ("holati");

-- Tovar: kategoriyaId index (used in category filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "tovarlar_kategoriyaId_idx" ON "tovarlar" ("kategoriyaId");

-- OmborHarakati: sotuvId index (used in sale lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ombor_harakati_sotuvId_idx" ON "ombor_harakati" ("sotuvId");

-- OmborHarakati: sana index (used in date range queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ombor_harakati_sana_idx" ON "ombor_harakati" ("sana");
