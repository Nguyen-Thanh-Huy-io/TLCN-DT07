-- Hỏi đáp chỉ còn ở Bài học (2026-11-14): bỏ giá trị ARTICLE khỏi DiscussionTargetType.
-- Article là trang tra cứu — chỉ giữ ghi chú cá nhân. Nếu còn câu hỏi gắn ARTICLE thì lệnh đổi kiểu
-- cột sẽ lỗi và cả transaction được hoàn tác (không mất dữ liệu âm thầm).
-- AlterEnum
BEGIN;
CREATE TYPE "DiscussionTargetType_new" AS ENUM ('LESSON');
ALTER TABLE "discussion_threads" ALTER COLUMN "target_type" TYPE "DiscussionTargetType_new" USING ("target_type"::text::"DiscussionTargetType_new");
ALTER TYPE "DiscussionTargetType" RENAME TO "DiscussionTargetType_old";
ALTER TYPE "DiscussionTargetType_new" RENAME TO "DiscussionTargetType";
DROP TYPE "public"."DiscussionTargetType_old";
COMMIT;
