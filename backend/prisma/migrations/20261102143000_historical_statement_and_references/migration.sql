-- 1. Create Enums for Statements
CREATE TYPE "StatementValueType" AS ENUM ('STRING', 'NUMBER', 'DATE', 'JSON');
CREATE TYPE "StatementRank" AS ENUM ('PREFERRED', 'NORMAL', 'DEPRECATED');

-- 2. Create Historical Reference Table
CREATE TABLE IF NOT EXISTS "historical_references" (
  "id" VARCHAR(36) PRIMARY KEY,
  "title" VARCHAR(500) NOT NULL,
  "author" VARCHAR(255),
  "publisher" VARCHAR(255),
  "publish_year" INTEGER,
  "url" VARCHAR(1000),
  "isbn" VARCHAR(50),
  "doi" VARCHAR(100),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "historical_references_title_idx" ON "historical_references"("title");
CREATE INDEX IF NOT EXISTS "historical_references_author_idx" ON "historical_references"("author");

-- 3. Create Historical Statement Table
CREATE TABLE IF NOT EXISTS "historical_statements" (
  "id" VARCHAR(36) PRIMARY KEY,
  "subject_entity_id" VARCHAR(36),
  "subject_event_id" VARCHAR(36),
  "predicate_id" VARCHAR(36) NOT NULL,
  "object_entity_id" VARCHAR(36),
  "object_event_id" VARCHAR(36),
  "object_value" JSONB,
  "object_value_type" "StatementValueType",
  "valid_from_year" INTEGER,
  "valid_to_year" INTEGER,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "qualifiers" JSONB,
  "verification_status" "VerificationStatus" NOT NULL DEFAULT 'VERIFIED',
  "rank" "StatementRank" NOT NULL DEFAULT 'NORMAL',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT "fk_statement_subject_entity" FOREIGN KEY ("subject_entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_statement_subject_event" FOREIGN KEY ("subject_event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_statement_predicate" FOREIGN KEY ("predicate_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fk_statement_object_entity" FOREIGN KEY ("object_entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_statement_object_event" FOREIGN KEY ("object_event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE,

  -- Ràng buộc Database CHECK Constraints
  CONSTRAINT "statement_subject_check" CHECK (
    ("subject_entity_id" IS NOT NULL AND "subject_event_id" IS NULL) OR
    ("subject_entity_id" IS NULL AND "subject_event_id" IS NOT NULL)
  ),
  CONSTRAINT "statement_object_check" CHECK (
    ("object_entity_id" IS NOT NULL AND "object_event_id" IS NULL AND "object_value" IS NULL AND "object_value_type" IS NULL) OR
    ("object_entity_id" IS NULL AND "object_event_id" IS NOT NULL AND "object_value" IS NULL AND "object_value_type" IS NULL) OR
    ("object_entity_id" IS NULL AND "object_event_id" IS NULL AND "object_value" IS NOT NULL AND "object_value_type" IS NOT NULL)
  ),
  CONSTRAINT "statement_no_self_loop_check" CHECK (
    ("subject_entity_id" IS NULL OR "object_entity_id" IS NULL OR "subject_entity_id" <> "object_entity_id") AND
    ("subject_event_id" IS NULL OR "object_event_id" IS NULL OR "subject_event_id" <> "object_event_id")
  ),
  CONSTRAINT "statement_year_range_check" CHECK (
    "valid_to_year" IS NULL OR "valid_from_year" IS NULL OR "valid_to_year" >= "valid_from_year"
  ),
  CONSTRAINT "statement_no_year_zero_check" CHECK (
    ("valid_from_year" IS NULL OR "valid_from_year" <> 0) AND
    ("valid_to_year" IS NULL OR "valid_to_year" <> 0)
  )
);

-- Indexes for fast querying & graph traversal
CREATE INDEX IF NOT EXISTS "historical_statements_subject_entity_id_idx" ON "historical_statements"("subject_entity_id");
CREATE INDEX IF NOT EXISTS "historical_statements_subject_event_id_idx" ON "historical_statements"("subject_event_id");
CREATE INDEX IF NOT EXISTS "historical_statements_predicate_id_idx" ON "historical_statements"("predicate_id");
CREATE INDEX IF NOT EXISTS "historical_statements_object_entity_id_idx" ON "historical_statements"("object_entity_id");
CREATE INDEX IF NOT EXISTS "historical_statements_object_event_id_idx" ON "historical_statements"("object_event_id");
CREATE INDEX IF NOT EXISTS "historical_statements_valid_from_to_idx" ON "historical_statements"("valid_from_year", "valid_to_year");
CREATE INDEX IF NOT EXISTS "historical_statements_is_primary_idx" ON "historical_statements"("is_primary");
CREATE INDEX IF NOT EXISTS "historical_statements_display_order_idx" ON "historical_statements"("display_order");

-- Unique Indexes handling NULLs
CREATE UNIQUE INDEX IF NOT EXISTS "unique_statement_entity_entity_idx"
  ON "historical_statements" ("subject_entity_id", "predicate_id", "object_entity_id")
  WHERE "subject_entity_id" IS NOT NULL AND "object_entity_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "unique_statement_entity_event_idx"
  ON "historical_statements" ("subject_entity_id", "predicate_id", "object_event_id")
  WHERE "subject_entity_id" IS NOT NULL AND "object_event_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "unique_statement_event_event_idx"
  ON "historical_statements" ("subject_event_id", "predicate_id", "object_event_id")
  WHERE "subject_event_id" IS NOT NULL AND "object_event_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "unique_statement_event_entity_idx"
  ON "historical_statements" ("subject_event_id", "predicate_id", "object_entity_id")
  WHERE "subject_event_id" IS NOT NULL AND "object_entity_id" IS NOT NULL;

-- 4. Create Historical Statement Reference Junction Table
CREATE TABLE IF NOT EXISTS "historical_statement_references" (
  "id" VARCHAR(36) PRIMARY KEY,
  "statement_id" VARCHAR(36) NOT NULL,
  "reference_id" VARCHAR(36) NOT NULL,
  "page_number" VARCHAR(50),
  "chapter" VARCHAR(150),
  "quote" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_stmt_ref_statement" FOREIGN KEY ("statement_id") REFERENCES "historical_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_stmt_ref_reference" FOREIGN KEY ("reference_id") REFERENCES "historical_references"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "uq_stmt_ref_page" UNIQUE ("statement_id", "reference_id", "page_number")
);

CREATE INDEX IF NOT EXISTS "historical_statement_references_statement_id_idx" ON "historical_statement_references"("statement_id");
CREATE INDEX IF NOT EXISTS "historical_statement_references_reference_id_idx" ON "historical_statement_references"("reference_id");

-- 5. Create Historical Event Period Junction Table
CREATE TABLE IF NOT EXISTS "historical_event_periods" (
  "event_id" VARCHAR(36) NOT NULL,
  "period_id" VARCHAR(36) NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "historical_event_periods_pkey" PRIMARY KEY ("event_id", "period_id"),
  CONSTRAINT "fk_event_period_event" FOREIGN KEY ("event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_event_period_period" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "historical_event_periods_period_id_idx" ON "historical_event_periods"("period_id");
CREATE INDEX IF NOT EXISTS "historical_event_periods_event_id_idx" ON "historical_event_periods"("event_id");

-- 6. Backfill Data từ 3 bảng quan hệ cũ sang HistoricalStatement

-- A. Backfill Event - Period
INSERT INTO "historical_event_periods" ("event_id", "period_id", "is_primary", "display_order")
SELECT "id", "period_id", true, "display_order"
FROM "historical_events"
WHERE "period_id" IS NOT NULL
ON CONFLICT ("event_id", "period_id") DO NOTHING;

-- B. Backfill từ historical_entity_relations (Entity ↔ Entity)
INSERT INTO "historical_statements" (
  "id",
  "subject_entity_id",
  "predicate_id",
  "object_entity_id",
  "valid_from_year",
  "valid_to_year",
  "qualifiers",
  "verification_status",
  "created_at"
)
SELECT
  her."id",
  her."source_entity_id",
  COALESCE(her."relation_type_id", t."id"),
  her."target_entity_id",
  her."start_year",
  her."end_year",
  CASE WHEN her."note" IS NOT NULL THEN jsonb_build_object('note', her."note") ELSE NULL END,
  'VERIFIED'::"VerificationStatus",
  her."created_at"
FROM "historical_entity_relations" her
LEFT JOIN "taxonomy_terms" t
  ON (t."code" = her."relation_type" AND t."group_code" = 'ENTITY_RELATION')
WHERE COALESCE(her."relation_type_id", t."id") IS NOT NULL
  AND her."source_entity_id" <> her."target_entity_id"
ON CONFLICT ("id") DO NOTHING;

-- C. Backfill từ historical_event_relations (Event ↔ Event)
INSERT INTO "historical_statements" (
  "id",
  "subject_event_id",
  "predicate_id",
  "object_event_id",
  "qualifiers",
  "verification_status",
  "created_at"
)
SELECT
  evr."id",
  evr."source_event_id",
  COALESCE(evr."relation_type_id", t."id"),
  evr."target_event_id",
  jsonb_strip_nulls(jsonb_build_object(
    'description', evr."description",
    'sourceReference', evr."source_reference"
  )),
  evr."status",
  evr."created_at"
FROM "historical_event_relations" evr
LEFT JOIN "taxonomy_terms" t
  ON (t."code" = evr."relation_type" AND t."group_code" = 'EVENT_RELATION')
WHERE COALESCE(evr."relation_type_id", t."id") IS NOT NULL
  AND evr."source_event_id" <> evr."target_event_id"
ON CONFLICT ("id") DO NOTHING;

-- D. Backfill từ historical_event_entities (Entity ↔ Event)
INSERT INTO "historical_statements" (
  "id",
  "subject_entity_id",
  "predicate_id",
  "object_event_id",
  "is_primary",
  "display_order",
  "qualifiers",
  "verification_status",
  "created_at"
)
SELECT
  gen_random_uuid()::text,
  hee."entity_id",
  COALESCE(hee."role_id", t."id"),
  hee."event_id",
  hee."is_primary",
  hee."display_order",
  jsonb_strip_nulls(jsonb_build_object(
    'roleCode', hee."role",
    'roleLabel', hee."role_label",
    'notes', hee."notes"
  )),
  'VERIFIED'::"VerificationStatus",
  hee."created_at"
FROM "historical_event_entities" hee
LEFT JOIN "taxonomy_terms" t
  ON (t."code" = hee."role" AND t."group_code" = 'EVENT_ROLE')
WHERE COALESCE(hee."role_id", t."id") IS NOT NULL
ON CONFLICT DO NOTHING;
