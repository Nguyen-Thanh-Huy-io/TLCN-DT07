-- Repair legacy DB: các migration note anchor/kind/labels đã bị đánh dấu applied
-- nhưng notes vẫn thiếu các cột mới trong schema hiện tại.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NoteKind') THEN
    CREATE TYPE "NoteKind" AS ENUM ('HIGHLIGHT', 'NOTE', 'DEFINITION', 'QUESTION', 'IMPORTANT', 'SUMMARY');
  END IF;
END $$;

ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "anchor" JSONB;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "content_version" INTEGER;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "labels" TEXT[];
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3);

UPDATE "notes" SET "labels" = ARRAY[]::TEXT[] WHERE "labels" IS NULL;
ALTER TABLE "notes"
  ALTER COLUMN "labels" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "labels" SET NOT NULL;

ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "kind" "NoteKind";
UPDATE "notes" SET "kind" = 'HIGHLIGHT' WHERE btrim("content") = '' AND "kind" IS NULL;
UPDATE "notes" SET "kind" = 'NOTE' WHERE "kind" IS NULL;
ALTER TABLE "notes" ALTER COLUMN "kind" SET DEFAULT 'NOTE';
ALTER TABLE "notes" ALTER COLUMN "kind" SET NOT NULL;

DROP INDEX IF EXISTS "notes_user_id_idx";
CREATE INDEX IF NOT EXISTS "notes_user_id_kind_idx" ON "notes"("user_id", "kind");
CREATE INDEX IF NOT EXISTS "notes_labels_idx" ON "notes" USING GIN ("labels");
