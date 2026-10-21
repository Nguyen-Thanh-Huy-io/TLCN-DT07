-- AlterTable historical_events: add parent_id for hierarchy
ALTER TABLE "historical_events"
  ADD COLUMN IF NOT EXISTS "parent_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "historical_events_parent_id_idx" ON "historical_events"("parent_id");

-- AddForeignKey
ALTER TABLE "historical_events"
  ADD CONSTRAINT "historical_events_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "historical_events"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
