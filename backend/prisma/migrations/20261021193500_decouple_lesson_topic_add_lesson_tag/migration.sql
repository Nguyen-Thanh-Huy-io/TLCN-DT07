-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_topic_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "lessons_topic_id_idx";

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "topic_id";

-- RecreateTable lesson_tags with clean schema
DROP TABLE IF EXISTS "lesson_tags" CASCADE;

CREATE TABLE "lesson_tags" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "lesson_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lesson_tags_lesson_id_idx" ON "lesson_tags"("lesson_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lesson_tags_tag_id_idx" ON "lesson_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_tags_lesson_id_tag_id_key" ON "lesson_tags"("lesson_id", "tag_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lesson_tags_lesson_id_fkey'
    ) THEN
        ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_lesson_id_fkey"
            FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lesson_tags_tag_id_fkey'
    ) THEN
        ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_tag_id_fkey"
            FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
