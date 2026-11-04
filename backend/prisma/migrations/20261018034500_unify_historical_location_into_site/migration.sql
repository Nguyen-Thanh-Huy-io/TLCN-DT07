-- =========================================================================
-- Migration: Unify HistoricalLocation into HistoricalEntity (LOCATION) + HistoricalSite
-- 1. Add 'LOCATION' to HistoricalEntityType enum
-- 2. Migrate existing historical_locations data into historical_entities + historical_sites
-- 3. Update historical_events: rename location_id to site_id and link FK to historical_sites(entity_id)
-- 4. Migrate lesson_locations into lesson_entities
-- 5. Drop obsolete tables: lesson_locations, historical_locations, and enum HistoricalLocationType
-- 6. Add UNIQUE constraints to historical_entity_relations and historical_event_relations
-- 7. Ensure historical_events.slug is NOT NULL
-- =========================================================================

-- Step 1: Add LOCATION to HistoricalEntityType enum if not already present
ALTER TYPE "HistoricalEntityType" ADD VALUE IF NOT EXISTS 'LOCATION';

-- Step 2: Migrate data from historical_locations to historical_entities and historical_sites
INSERT INTO "historical_entities" (
    "id",
    "name",
    "slug",
    "type",
    "tagline",
    "description",
    "aliases",
    "image_url",
    "status",
    "created_at",
    "updated_at",
    "is_featured",
    "display_order"
)
SELECT
    hl."id",
    hl."name",
    hl."slug",
    'LOCATION'::"HistoricalEntityType",
    hl."historical_significance",
    hl."description",
    hl."historical_names",
    hl."image_url",
    hl."status",
    hl."created_at",
    hl."updated_at",
    false,
    0
FROM "historical_locations" hl
ON CONFLICT ("id") DO NOTHING;

-- Insert into historical_sites using the same entity_id
INSERT INTO "historical_sites" (
    "entity_id",
    "site_type",
    "address",
    "latitude",
    "longitude"
)
SELECT
    hl."id",
    hl."type"::text,
    hl."address",
    hl."latitude"::decimal(10, 7),
    hl."longitude"::decimal(10, 7)
FROM "historical_locations" hl
ON CONFLICT ("entity_id") DO NOTHING;

-- Step 3: Migrate lesson_locations into lesson_entities
INSERT INTO "lesson_entities" ("lesson_id", "entity_id", "role", "created_at")
SELECT
    ll."lesson_id",
    ll."location_id",
    'LOCATION_OF' as "role",
    ll."created_at"
FROM "lesson_locations" ll
ON CONFLICT ("lesson_id", "entity_id") DO NOTHING;

-- Step 4: Update foreign key and column in historical_events
-- Drop old foreign key constraint to historical_locations
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_location_id_fkey";
DROP INDEX IF EXISTS "historical_events_location_id_idx";

-- Rename location_id to site_id if location_id exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historical_events' AND column_name = 'location_id'
    ) THEN
        ALTER TABLE "historical_events" RENAME COLUMN "location_id" TO "site_id";
    END IF;
END $$;

-- Create index on site_id
CREATE INDEX IF NOT EXISTS "historical_events_site_id_idx" ON "historical_events"("site_id");

-- Add foreign key referencing historical_sites(entity_id)
ALTER TABLE "historical_events" 
    ADD CONSTRAINT "historical_events_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "historical_sites"("entity_id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Make historical_events.slug NOT NULL
UPDATE "historical_events" 
SET "slug" = 'event-' || "id" 
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "historical_events" ALTER COLUMN "slug" SET NOT NULL;

-- Step 6: Drop obsolete tables and enum
DROP TABLE IF EXISTS "lesson_locations" CASCADE;
DROP TABLE IF EXISTS "historical_locations" CASCADE;
DROP TYPE IF EXISTS "HistoricalLocationType";

-- Step 7: Unique constraints on relations (Knowledge Graph)
-- HistoricalEntityRelation unique
DROP INDEX IF EXISTS "historical_entity_relations_source_entity_id_target_entity_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "historical_entity_relations_source_entity_id_target_entity_key" 
    ON "historical_entity_relations"("source_entity_id", "target_entity_id", "relation_type");

-- HistoricalEventRelation unique
DROP INDEX IF EXISTS "historical_event_relations_source_event_id_target_event_id__idx";
CREATE UNIQUE INDEX IF NOT EXISTS "historical_event_relations_source_event_id_target_event_id__key" 
    ON "historical_event_relations"("source_event_id", "target_event_id", "relation_type");
