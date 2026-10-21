-- AlterTable historical_events: make topic_id nullable, drop cascade FK, add period_id, location_id, slug, end_year, status
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_topic_id_fkey";

ALTER TABLE "historical_events"
  ALTER COLUMN "topic_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "period_id" TEXT,
  ADD COLUMN IF NOT EXISTS "location_id" TEXT,
  ADD COLUMN IF NOT EXISTS "slug" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "end_year" INTEGER,
  ADD COLUMN IF NOT EXISTS "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateTable historical_event_entities
CREATE TABLE IF NOT EXISTS "historical_event_entities" (
    "event_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "role" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_event_entities_pkey" PRIMARY KEY ("event_id","entity_id")
);

-- CreateTable lesson_events
CREATE TABLE IF NOT EXISTS "lesson_events" (
    "lesson_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_events_pkey" PRIMARY KEY ("lesson_id","event_id")
);

-- CreateTable lesson_entities
CREATE TABLE IF NOT EXISTS "lesson_entities" (
    "lesson_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "role" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_entities_pkey" PRIMARY KEY ("lesson_id","entity_id")
);

-- CreateTable lesson_locations
CREATE TABLE IF NOT EXISTS "lesson_locations" (
    "lesson_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_locations_pkey" PRIMARY KEY ("lesson_id","location_id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "historical_events_slug_key" ON "historical_events"("slug");
CREATE INDEX IF NOT EXISTS "historical_events_period_id_idx" ON "historical_events"("period_id");
CREATE INDEX IF NOT EXISTS "historical_events_location_id_idx" ON "historical_events"("location_id");
CREATE INDEX IF NOT EXISTS "historical_events_status_idx" ON "historical_events"("status");
CREATE INDEX IF NOT EXISTS "historical_event_entities_entity_id_idx" ON "historical_event_entities"("entity_id");
CREATE INDEX IF NOT EXISTS "lesson_events_event_id_idx" ON "lesson_events"("event_id");
CREATE INDEX IF NOT EXISTS "lesson_entities_entity_id_idx" ON "lesson_entities"("entity_id");
CREATE INDEX IF NOT EXISTS "lesson_locations_location_id_idx" ON "lesson_locations"("location_id");

-- AddForeignKey
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "historical_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "historical_event_entities" ADD CONSTRAINT "historical_event_entities_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "historical_event_entities" ADD CONSTRAINT "historical_event_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_events" ADD CONSTRAINT "lesson_events_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_events" ADD CONSTRAINT "lesson_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_entities" ADD CONSTRAINT "lesson_entities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_entities" ADD CONSTRAINT "lesson_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_locations" ADD CONSTRAINT "lesson_locations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_locations" ADD CONSTRAINT "lesson_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "historical_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
