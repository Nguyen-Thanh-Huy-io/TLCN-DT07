-- Dọn sạch dữ liệu seed cũ trước khi đổi cấu trúc — đã chốt với người dùng: DB chỉ có dữ
-- liệu Pilot v1.0 (dev), không có dữ liệu thật, không cần migrate/backfill. Các cột mới
-- thêm NOT NULL bên dưới (entity_id, subject_id) không có default nên bảng phải rỗng
-- trước khi ALTER. CASCADE để dọn luôn historical_entities (rows type=EVENT không còn
-- hợp lệ sau khi xoá historical_events) — toàn bộ Pilot build lại bằng seed:all sau.
--
-- Lưu ý: migration này chứa ALTER TYPE ... ADD VALUE nên Prisma chạy từng câu lệnh với
-- autocommit riêng (không rollback cả file khi có câu lệnh lỗi giữa đường) — mọi câu lệnh
-- dưới đây viết lại cho idempotent (IF EXISTS / IF NOT EXISTS) để chạy lại an toàn sau khi
-- `prisma migrate resolve --rolled-back` nếu có thất bại giữa đường.
TRUNCATE TABLE
  "historical_entities",
  "historical_events",
  "historical_statements",
  "historical_event_participants",
  "historical_event_participant_references",
  "historical_event_periods",
  "historical_event_media",
  "historical_statement_references"
CASCADE;

-- Trigger/function này gắn vào cột "category" của historical_events (migration
-- 20261023050000_event_category_ids_trigger) — cột sắp bị xoá nên phải bỏ trigger trước.
DROP TRIGGER IF EXISTS "historical_events_fill_category_ids" ON "historical_events";
DROP FUNCTION IF EXISTS "fill_event_category_ids"();

-- AlterEnum
ALTER TYPE "HistoricalEntityType" ADD VALUE IF NOT EXISTS 'EVENT';

-- DropForeignKey
ALTER TABLE "historical_event_media" DROP CONSTRAINT IF EXISTS "historical_event_media_event_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_event_participant_references" DROP CONSTRAINT IF EXISTS "historical_event_participant_references_participant_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_event_participant_references" DROP CONSTRAINT IF EXISTS "historical_event_participant_references_reference_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_event_participants" DROP CONSTRAINT IF EXISTS "historical_event_participants_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_event_participants" DROP CONSTRAINT IF EXISTS "historical_event_participants_event_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_event_participants" DROP CONSTRAINT IF EXISTS "historical_event_participants_role_term_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_event_periods" DROP CONSTRAINT IF EXISTS "historical_event_periods_event_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_event_periods" DROP CONSTRAINT IF EXISTS "historical_event_periods_period_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_location_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_period_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "historical_statements_object_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "historical_statements_object_event_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "historical_statements_subject_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "historical_statements_subject_event_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "historical_events_category_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_events_display_order_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_events_location_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_events_period_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_events_slug_key";

-- DropIndex
DROP INDEX IF EXISTS "historical_events_start_year_start_month_start_day_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_events_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_statements_object_entity_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_statements_object_event_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_statements_subject_entity_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "historical_statements_subject_event_id_idx";

-- DropIndex (unique constraint indexes trên các cột sắp bị xoá ở historical_statements)
DROP INDEX IF EXISTS "unique_statement_entity_entity_idx";
DROP INDEX IF EXISTS "unique_statement_entity_event_idx";
DROP INDEX IF EXISTS "unique_statement_event_entity_idx";
DROP INDEX IF EXISTS "unique_statement_event_event_idx";

-- Check constraints tham chiếu các cột sắp bị xoá — phải bỏ trước khi DROP COLUMN
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "statement_no_self_loop_check";
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "statement_object_check";
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "statement_subject_check";

-- AlterTable
ALTER TABLE "historical_entities"
  ADD COLUMN IF NOT EXISTS "end_day" INTEGER,
  ADD COLUMN IF NOT EXISTS "end_month" INTEGER,
  ADD COLUMN IF NOT EXISTS "start_day" INTEGER,
  ADD COLUMN IF NOT EXISTS "start_month" INTEGER;

-- AlterTable
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_pkey";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "category";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "created_at";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "date_precision";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "date_text";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "description";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "display_order";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "end_day";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "end_month";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "end_year";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "id";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "location_id";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "metadata";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "period_id";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "start_day";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "start_month";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "start_year";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "status";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "summary";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "thumbnail_url";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "title";
ALTER TABLE "historical_events" DROP COLUMN IF EXISTS "updated_at";
ALTER TABLE "historical_events" ADD COLUMN IF NOT EXISTS "entity_id" TEXT;
ALTER TABLE "historical_events" ALTER COLUMN "entity_id" SET NOT NULL;
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_pkey";
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_pkey" PRIMARY KEY ("entity_id");

-- AlterTable
ALTER TABLE "historical_statements" DROP COLUMN IF EXISTS "object_entity_id";
ALTER TABLE "historical_statements" DROP COLUMN IF EXISTS "object_event_id";
ALTER TABLE "historical_statements" DROP COLUMN IF EXISTS "subject_entity_id";
ALTER TABLE "historical_statements" DROP COLUMN IF EXISTS "subject_event_id";
ALTER TABLE "historical_statements" ADD COLUMN IF NOT EXISTS "object_id" TEXT;
ALTER TABLE "historical_statements" ADD COLUMN IF NOT EXISTS "subject_id" TEXT;
ALTER TABLE "historical_statements" ALTER COLUMN "subject_id" SET NOT NULL;

-- DropTable
DROP TABLE IF EXISTS "historical_event_media";

-- DropTable
DROP TABLE IF EXISTS "historical_event_participant_references";

-- DropTable
DROP TABLE IF EXISTS "historical_event_participants";

-- DropTable
DROP TABLE IF EXISTS "historical_event_periods";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "historical_statements_subject_id_idx" ON "historical_statements"("subject_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "historical_statements_object_id_idx" ON "historical_statements"("object_id");

-- AddForeignKey
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_entity_id_fkey";
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_events" DROP CONSTRAINT IF EXISTS "historical_events_parent_id_fkey";
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "historical_events"("entity_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "historical_statements_subject_id_fkey";
ALTER TABLE "historical_statements" ADD CONSTRAINT "historical_statements_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT IF EXISTS "historical_statements_object_id_fkey";
ALTER TABLE "historical_statements" ADD CONSTRAINT "historical_statements_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
