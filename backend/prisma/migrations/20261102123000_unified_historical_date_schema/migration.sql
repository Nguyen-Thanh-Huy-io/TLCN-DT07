-- 1. Migrate DatePrecision enum values safely
CREATE TYPE "DatePrecision_new" AS ENUM (
  'DAY',
  'MONTH',
  'YEAR',
  'DECADE',
  'CENTURY',
  'APPROXIMATE',
  'RANGE',
  'UNKNOWN'
);

ALTER TABLE "periods"
  ALTER COLUMN "date_precision" TYPE "DatePrecision_new"
  USING (
    CASE "date_precision"::text
      WHEN 'EXACT_YEAR' THEN 'YEAR'::"DatePrecision_new"
      WHEN 'MILLENNIUM' THEN 'APPROXIMATE'::"DatePrecision_new"
      ELSE "date_precision"::text::"DatePrecision_new"
    END
  );

DROP TYPE "DatePrecision";
ALTER TYPE "DatePrecision_new" RENAME TO "DatePrecision";

-- 2. HistoricalEvent: make start_year nullable + add date_text & date_precision
ALTER TABLE "historical_events"
  ALTER COLUMN "start_year" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "date_text" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "date_precision" "DatePrecision";

UPDATE "historical_events"
SET "date_text" = "event_date_note"
WHERE "date_text" IS NULL AND "event_date_note" IS NOT NULL;

UPDATE "historical_events"
SET "date_precision" = CASE
  WHEN "start_year" IS NOT NULL AND "start_month" IS NOT NULL AND "start_day" IS NOT NULL THEN 'DAY'::"DatePrecision"
  WHEN "start_year" IS NOT NULL AND "start_month" IS NOT NULL THEN 'MONTH'::"DatePrecision"
  WHEN "start_year" IS NOT NULL AND "end_year" IS NOT NULL AND "end_year" <> "start_year" THEN 'RANGE'::"DatePrecision"
  WHEN "start_year" IS NOT NULL THEN 'YEAR'::"DatePrecision"
  ELSE 'UNKNOWN'::"DatePrecision"
END
WHERE "date_precision" IS NULL;

-- 3. Period: add date_text and backfill from time_label
ALTER TABLE "periods"
  ADD COLUMN IF NOT EXISTS "date_text" VARCHAR(150);

UPDATE "periods"
SET "date_text" = "time_label"
WHERE "date_text" IS NULL AND "time_label" IS NOT NULL;

-- 4. HistoricalEntity: add date_text & date_precision
ALTER TABLE "historical_entities"
  ADD COLUMN IF NOT EXISTS "date_text" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "date_precision" "DatePrecision";

CREATE INDEX IF NOT EXISTS "historical_entities_start_year_end_year_idx"
  ON "historical_entities"("start_year", "end_year");

-- 5. Person: add birth/death date_text, month, day, precision and backfill from labels
ALTER TABLE "persons"
  ADD COLUMN IF NOT EXISTS "birth_date_text" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "birth_month" INTEGER,
  ADD COLUMN IF NOT EXISTS "birth_day" INTEGER,
  ADD COLUMN IF NOT EXISTS "birth_precision" "DatePrecision",
  ADD COLUMN IF NOT EXISTS "death_date_text" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "death_month" INTEGER,
  ADD COLUMN IF NOT EXISTS "death_day" INTEGER,
  ADD COLUMN IF NOT EXISTS "death_precision" "DatePrecision";

UPDATE "persons"
SET
  "birth_date_text" = COALESCE("birth_date_text", "birth_date_label"),
  "death_date_text" = COALESCE("death_date_text", "death_date_label")
WHERE "birth_date_label" IS NOT NULL OR "death_date_label" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "persons_birth_year_death_year_idx"
  ON "persons"("birth_year", "death_year");

-- 6. HistoricalSite: add construction_date_text, month, day, end_year, precision and backfill
ALTER TABLE "historical_sites"
  ALTER COLUMN "construction_label" TYPE VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "construction_date_text" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "construction_month" INTEGER,
  ADD COLUMN IF NOT EXISTS "construction_day" INTEGER,
  ADD COLUMN IF NOT EXISTS "construction_end_year" INTEGER,
  ADD COLUMN IF NOT EXISTS "date_precision" "DatePrecision";

UPDATE "historical_sites"
SET "construction_date_text" = "construction_label"
WHERE "construction_date_text" IS NULL AND "construction_label" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "historical_sites_construction_year_idx"
  ON "historical_sites"("construction_year");
