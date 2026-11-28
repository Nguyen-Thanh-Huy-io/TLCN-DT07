-- CreateTable
CREATE TABLE "curriculum_tracks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_tracks_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "learning_paths"
    ADD COLUMN "track_id" TEXT,
    ADD COLUMN "stage_order" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "stage_exam_quiz_id" TEXT,
    ADD COLUMN "stage_exam_pass_score" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_tracks_slug_key" ON "curriculum_tracks"("slug");
CREATE INDEX "curriculum_tracks_status_idx" ON "curriculum_tracks"("status");
CREATE INDEX "curriculum_tracks_display_order_idx" ON "curriculum_tracks"("display_order");
CREATE INDEX "learning_paths_track_id_stage_order_idx" ON "learning_paths"("track_id", "stage_order");
CREATE INDEX "learning_paths_stage_exam_quiz_id_idx" ON "learning_paths"("stage_exam_quiz_id");

-- AddForeignKey
ALTER TABLE "learning_paths"
    ADD CONSTRAINT "learning_paths_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "curriculum_tracks"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths"
    ADD CONSTRAINT "learning_paths_stage_exam_quiz_id_fkey"
    FOREIGN KEY ("stage_exam_quiz_id") REFERENCES "quizzes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: Tạo 1 Mạch mặc định cho các lộ trình CHRONOLOGICAL hiện có (nếu có)
INSERT INTO "curriculum_tracks" ("id", "title", "slug", "description", "display_order", "status", "created_at", "updated_at")
SELECT
    '00000000-0000-4000-8000-000000000001',
    'Tiến trình Lịch sử Việt Nam: Từ Dựng nước đến Đại Việt',
    'tien-trinh-lich-su-viet-nam-tu-dung-nuoc-den-dai-viet',
    'Mạch học cốt lõi xuyên suốt từ thời đại Hùng Vương – An Dương Vương, nghìn năm Bắc thuộc đến kỷ nguyên độc lập Đại Việt.',
    1,
    'PUBLISHED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1 FROM "learning_paths" WHERE "path_type" = 'CHRONOLOGICAL'
)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "learning_paths"
SET "track_id" = (SELECT "id" FROM "curriculum_tracks" WHERE "slug" = 'tien-trinh-lich-su-viet-nam-tu-dung-nuoc-den-dai-viet' LIMIT 1)
WHERE "path_type" = 'CHRONOLOGICAL' AND "track_id" IS NULL;
