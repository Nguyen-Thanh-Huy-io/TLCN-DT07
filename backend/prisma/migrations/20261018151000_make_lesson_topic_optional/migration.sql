-- 1. Alter Table lessons: drop not null on topic_id
ALTER TABLE "lessons" ALTER COLUMN "topic_id" DROP NOT NULL;

-- 2. Update foreign key to SET NULL on delete
ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_topic_id_fkey";

DO $$ BEGIN
    ALTER TABLE "lessons"
        ADD CONSTRAINT "lessons_topic_id_fkey"
        FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
