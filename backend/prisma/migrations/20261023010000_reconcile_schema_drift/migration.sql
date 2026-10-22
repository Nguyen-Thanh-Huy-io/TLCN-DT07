-- Đưa DB khớp lại schema.prisma (dọn drift tích lũy từ các lần sửa tay trước đây).
-- Đã kiểm tra trước khi tạo: lesson_entities / lesson_events / lesson_media đều trống,
-- lessons.summary không có dữ liệu, không có dòng NULL ở các cột chuyển sang NOT NULL.

-- DropForeignKey
ALTER TABLE "lesson_entities" DROP CONSTRAINT "lesson_entities_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "lesson_entities" DROP CONSTRAINT "lesson_entities_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "lesson_events" DROP CONSTRAINT "lesson_events_event_id_fkey";

-- DropForeignKey
ALTER TABLE "lesson_events" DROP CONSTRAINT "lesson_events_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "lesson_media" DROP CONSTRAINT "lesson_media_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_created_by_fkey";

-- DropIndex
DROP INDEX "lessons_difficulty_idx";

-- AlterTable
ALTER TABLE "chapter_lessons" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chapters" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "learning_paths" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lesson_tags" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "summary",
ALTER COLUMN "difficulty" SET NOT NULL,
ALTER COLUMN "display_order" SET NOT NULL,
ALTER COLUMN "content" SET NOT NULL;

-- DropTable
DROP TABLE "lesson_entities";

-- DropTable
DROP TABLE "lesson_events";

-- DropTable
DROP TABLE "lesson_media";
