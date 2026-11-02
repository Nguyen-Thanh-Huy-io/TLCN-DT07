-- ====================================================================
-- Migration: 20261102170000_event_participants_and_predicate_rules
-- Purpose:
--   1. Create taxonomy_predicate_rules table (Rule Engine for Knowledge Graph Predicates)
--   2. Add format_term_id and nature_term_id to historical_references (SOURCE_FORMAT & SOURCE_NATURE)
--   3. Create historical_event_participants table (Unified historical entity participation in events)
--   4. Create historical_event_participant_references table (Source citations for event participants)
-- ====================================================================

-- 1. Create Taxonomy Predicate Rules Table
CREATE TABLE IF NOT EXISTS "taxonomy_predicate_rules" (
  "id" VARCHAR(36) PRIMARY KEY,
  "predicate_term_id" VARCHAR(36) NOT NULL UNIQUE,
  "allowed_subject_types" TEXT[] NOT NULL DEFAULT '{}',
  "allowed_object_types" TEXT[] NOT NULL DEFAULT '{}',
  "is_symmetric" BOOLEAN NOT NULL DEFAULT false,
  "is_transitive" BOOLEAN NOT NULL DEFAULT false,
  "allowed_qualifiers" TEXT[] NOT NULL DEFAULT '{}',
  "is_required_qualifiers" TEXT[] NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_predicate_rule_term" FOREIGN KEY ("predicate_term_id")
    REFERENCES "taxonomy_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "taxonomy_predicate_rules_predicate_term_id_idx"
  ON "taxonomy_predicate_rules"("predicate_term_id");

-- 2. Extend Historical Reference with Format & Nature Taxonomy Links
ALTER TABLE "historical_references"
  ADD COLUMN IF NOT EXISTS "format_term_id" VARCHAR(36),
  ADD COLUMN IF NOT EXISTS "nature_term_id" VARCHAR(36);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reference_format_term'
  ) THEN
    ALTER TABLE "historical_references"
      ADD CONSTRAINT "fk_reference_format_term"
      FOREIGN KEY ("format_term_id") REFERENCES "taxonomy_terms"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reference_nature_term'
  ) THEN
    ALTER TABLE "historical_references"
      ADD CONSTRAINT "fk_reference_nature_term"
      FOREIGN KEY ("nature_term_id") REFERENCES "taxonomy_terms"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "historical_references_format_term_id_idx"
  ON "historical_references"("format_term_id");
CREATE INDEX IF NOT EXISTS "historical_references_nature_term_id_idx"
  ON "historical_references"("nature_term_id");

-- 3. Create Historical Event Participants Table
CREATE TABLE IF NOT EXISTS "historical_event_participants" (
  "id" VARCHAR(36) PRIMARY KEY,
  "event_id" VARCHAR(36) NOT NULL,
  "entity_id" VARCHAR(36) NOT NULL,
  "role_term_id" VARCHAR(36),
  "role_label_override" VARCHAR(150),
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "start_year" INTEGER,
  "end_year" INTEGER,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT "fk_participant_event" FOREIGN KEY ("event_id")
    REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_participant_entity" FOREIGN KEY ("entity_id")
    REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_participant_role_term" FOREIGN KEY ("role_term_id")
    REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE,

  -- Logical Constraint: start_year <= end_year (when both present)
  CONSTRAINT "chk_participant_timeline" CHECK (
    ("start_year" IS NULL OR "end_year" IS NULL) OR ("start_year" <= "end_year")
  )
);

CREATE INDEX IF NOT EXISTS "historical_event_participants_event_entity_idx"
  ON "historical_event_participants"("event_id", "entity_id");
CREATE INDEX IF NOT EXISTS "historical_event_participants_role_term_id_idx"
  ON "historical_event_participants"("role_term_id");
CREATE INDEX IF NOT EXISTS "historical_event_participants_is_primary_idx"
  ON "historical_event_participants"("is_primary");
CREATE INDEX IF NOT EXISTS "historical_event_participants_years_idx"
  ON "historical_event_participants"("start_year", "end_year");

-- 4. Create Historical Event Participant References Table
CREATE TABLE IF NOT EXISTS "historical_event_participant_references" (
  "id" VARCHAR(36) PRIMARY KEY,
  "participant_id" VARCHAR(36) NOT NULL,
  "reference_id" VARCHAR(36) NOT NULL,
  "page_number" VARCHAR(50),
  "chapter" VARCHAR(150),
  "quote" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_participant_ref_participant" FOREIGN KEY ("participant_id")
    REFERENCES "historical_event_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_participant_ref_reference" FOREIGN KEY ("reference_id")
    REFERENCES "historical_references"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "historical_event_participant_references_unique" UNIQUE ("participant_id", "reference_id", "page_number")
);

CREATE INDEX IF NOT EXISTS "historical_event_participant_references_participant_id_idx"
  ON "historical_event_participant_references"("participant_id");
CREATE INDEX IF NOT EXISTS "historical_event_participant_references_reference_id_idx"
  ON "historical_event_participant_references"("reference_id");

-- 5. Backfill Data from historical_event_entities into historical_event_participants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historical_event_entities') THEN
    INSERT INTO "historical_event_participants" (
      "id",
      "event_id",
      "entity_id",
      "role_term_id",
      "role_label_override",
      "is_primary",
      "display_order",
      "notes",
      "created_at"
    )
    SELECT
      gen_random_uuid()::text,
      hee."event_id",
      hee."entity_id",
      hee."role_id",
      hee."role_label",
      hee."is_primary",
      hee."display_order",
      hee."notes",
      hee."created_at"
    FROM "historical_event_entities" hee
    WHERE NOT EXISTS (
      SELECT 1 FROM "historical_event_participants" hep
      WHERE hep."event_id" = hee."event_id" AND hep."entity_id" = hee."entity_id"
    );
  END IF;
END $$;

