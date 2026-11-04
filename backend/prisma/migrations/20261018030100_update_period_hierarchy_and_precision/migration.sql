-- 1. Create Enum DatePrecision
DO $$ BEGIN
    CREATE TYPE "DatePrecision" AS ENUM ('EXACT_YEAR', 'APPROXIMATE', 'CENTURY', 'MILLENNIUM', 'UNKNOWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter Table periods
ALTER TABLE "periods"
    ADD COLUMN IF NOT EXISTS "parent_id" TEXT,
    ADD COLUMN IF NOT EXISTS "date_precision" "DatePrecision",
    ALTER COLUMN "start_year" DROP NOT NULL,
    ALTER COLUMN "time_label" TYPE VARCHAR(150);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS "periods_parent_id_idx" ON "periods"("parent_id");
CREATE INDEX IF NOT EXISTS "periods_start_year_end_year_idx" ON "periods"("start_year", "end_year");

-- Drop obsolete index if exists
DROP INDEX IF EXISTS "periods_display_order_idx";

-- 4. Add Foreign Key for PeriodHierarchy
DO $$ BEGIN
    ALTER TABLE "periods"
        ADD CONSTRAINT "periods_parent_id_fkey"
        FOREIGN KEY ("parent_id") REFERENCES "periods"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
