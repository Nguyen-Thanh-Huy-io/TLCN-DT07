-- =========================================================================
-- MIGRATION: SEPARATE LEARNING PATH, CHAPTER, AND DROP TOPIC KNOWLEDGE RELATIONS
-- =========================================================================

-- 1. Bỏ liên kết giữa Topic và Bách khoa Tri thức Lịch sử (Period & HistoricalEvent)
ALTER TABLE "topics" DROP CONSTRAINT IF EXISTS "topics_period_id_fkey";
DROP INDEX IF EXISTS "topics_period_id_idx";
ALTER TABLE "topics" DROP COLUMN IF EXISTS "period_id";

ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_topic_id_fkey";
DROP INDEX IF EXISTS "historical_events_topic_id_idx";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "topic_id";

-- 2. Tạo bảng Lộ trình học (learning_paths)
CREATE TABLE IF NOT EXISTS "learning_paths" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "path_type" "LearningPathType" NOT NULL DEFAULT 'CHRONOLOGICAL',
    "is_sequential" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "learning_paths_slug_key" ON "learning_paths"("slug");
CREATE INDEX IF NOT EXISTS "learning_paths_path_type_idx" ON "learning_paths"("path_type");
CREATE INDEX IF NOT EXISTS "learning_paths_status_idx" ON "learning_paths"("status");
CREATE INDEX IF NOT EXISTS "learning_paths_display_order_idx" ON "learning_paths"("display_order");

-- 3. Tạo bảng Chương học (chapters)
CREATE TABLE IF NOT EXISTS "chapters" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "learning_path_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chapters_learning_path_id_idx" ON "chapters"("learning_path_id");
CREATE INDEX IF NOT EXISTS "chapters_display_order_idx" ON "chapters"("display_order");

DO $$ BEGIN
    ALTER TABLE "chapters"
        ADD CONSTRAINT "chapters_learning_path_id_fkey"
        FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Tạo bảng nối nhiều-nhiều ChapterLesson (quản lý bài học trong chương và thứ tự kéo thả)
CREATE TABLE IF NOT EXISTS "chapter_lessons" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "chapter_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_lessons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chapter_lessons_chapter_id_lesson_id_key" ON "chapter_lessons"("chapter_id", "lesson_id");
CREATE INDEX IF NOT EXISTS "chapter_lessons_chapter_id_idx" ON "chapter_lessons"("chapter_id");
CREATE INDEX IF NOT EXISTS "chapter_lessons_lesson_id_idx" ON "chapter_lessons"("lesson_id");
CREATE INDEX IF NOT EXISTS "chapter_lessons_display_order_idx" ON "chapter_lessons"("display_order");

DO $$ BEGIN
    ALTER TABLE "chapter_lessons"
        ADD CONSTRAINT "chapter_lessons_chapter_id_fkey"
        FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "chapter_lessons"
        ADD CONSTRAINT "chapter_lessons_lesson_id_fkey"
        FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Di chuyển dữ liệu tương thích từ Topic sang LearningPath & Chapter (Data preservation)
-- 5.1. Tạo LearningPath từ các Topic gốc (parent_id IS NULL)
INSERT INTO "learning_paths" ("id", "title", "slug", "description", "cover_image_url", "path_type", "is_sequential", "display_order", "status", "created_at", "updated_at")
SELECT
    t."id"::text,
    t."name",
    t."slug",
    t."description",
    t."cover_image_url",
    t."path_type",
    t."is_sequential",
    t."display_order",
    t."status",
    t."created_at",
    t."updated_at"
FROM "topics" t
WHERE t."parent_id" IS NULL
ON CONFLICT ("id") DO UPDATE
SET "title" = EXCLUDED."title",
    "slug" = EXCLUDED."slug",
    "updated_at" = CURRENT_TIMESTAMP;

-- 5.2. Đưa toàn bộ các topic con đệ quy vào chapters với root_id là learning_path_id
WITH RECURSIVE topic_tree AS (
    SELECT id, name, slug, description, display_order, status, created_at, updated_at, parent_id, id AS root_id
    FROM topics
    WHERE parent_id IS NULL
    UNION ALL
    SELECT t.id, t.name, t.slug, t.description, t.display_order, t.status, t.created_at, t.updated_at, t.parent_id, tt.root_id
    FROM topics t
    JOIN topic_tree tt ON t.parent_id = tt.id
)
INSERT INTO "chapters" ("id", "learning_path_id", "title", "slug", "description", "display_order", "status", "created_at", "updated_at")
SELECT id, root_id, name, slug, description, display_order, status, created_at, updated_at
FROM topic_tree
WHERE parent_id IS NOT NULL
ON CONFLICT ("id") DO UPDATE
SET "learning_path_id" = EXCLUDED."learning_path_id",
    "title" = EXCLUDED."title",
    "updated_at" = CURRENT_TIMESTAMP;

-- 5.3. Tạo liên kết ChapterLesson từ các Lesson đã có topic_id nằm trong chapters
INSERT INTO "chapter_lessons" ("id", "chapter_id", "lesson_id", "display_order", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    l."topic_id"::text,
    l."id"::text,
    l."display_order",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "lessons" l
JOIN "chapters" c ON c."id" = l."topic_id"::text
ON CONFLICT ("chapter_id", "lesson_id") DO UPDATE
SET "display_order" = EXCLUDED."display_order",
    "updated_at" = CURRENT_TIMESTAMP;
