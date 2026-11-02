-- Dọn bảng nối cũ thay bằng HistoricalEventParticipant/HistoricalStatement (Knowledge Graph
-- mới) — toàn bộ code ứng dụng (CMS, API, trang public, seed) đã chuyển sang dùng bảng mới,
-- pipeline ingestion/ (chưa từng chạy vào DB thật) đã bị xoá theo yêu cầu. Cả 3 bảng đang trống
-- (0 dòng) ở thời điểm tạo migration này nên không cần backfill dữ liệu.
-- Chỉ giữ đúng phần DROP liên quan 3 bảng này; các câu rename constraint khác do
-- `prisma migrate diff` đề xuất là nhiễu đặt tên từ migration 20261102170000, không thuộc
-- phạm vi thay đổi này (xem ghi chú trong hisgo-migrations.md).

-- DropForeignKey
ALTER TABLE "historical_entity_relations" DROP CONSTRAINT "historical_entity_relations_relation_type_id_fkey";
ALTER TABLE "historical_entity_relations" DROP CONSTRAINT "historical_entity_relations_source_entity_id_fkey";
ALTER TABLE "historical_entity_relations" DROP CONSTRAINT "historical_entity_relations_target_entity_id_fkey";

ALTER TABLE "historical_event_entities" DROP CONSTRAINT "historical_event_entities_entity_id_fkey";
ALTER TABLE "historical_event_entities" DROP CONSTRAINT "historical_event_entities_event_id_fkey";
ALTER TABLE "historical_event_entities" DROP CONSTRAINT "historical_event_entities_role_id_fkey";

ALTER TABLE "historical_event_relations" DROP CONSTRAINT "historical_event_relations_relation_type_id_fkey";
ALTER TABLE "historical_event_relations" DROP CONSTRAINT "historical_event_relations_source_event_id_fkey";
ALTER TABLE "historical_event_relations" DROP CONSTRAINT "historical_event_relations_target_event_id_fkey";

-- DropTable
DROP TABLE "historical_entity_relations";
DROP TABLE "historical_event_entities";
DROP TABLE "historical_event_relations";

-- DropEnum
DROP TYPE "EventRelationType";
