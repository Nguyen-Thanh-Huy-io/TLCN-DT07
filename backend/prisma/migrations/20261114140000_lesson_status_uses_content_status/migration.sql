-- Bài học dùng chung ContentStatus với các nội dung khác, bỏ enum riêng LessonStatus.
-- Giá trị chờ duyệt đổi tên: REVIEW → PENDING_REVIEW; các giá trị còn lại trùng tên.
-- Prisma sinh DROP COLUMN + ADD COLUMN (mất dữ liệu) → viết lại bằng ALTER COLUMN ... USING.
-- Chỉ mục lessons_status_idx được Postgres dựng lại theo kiểu mới, không cần tạo lại.

ALTER TABLE "lessons" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "lessons" ALTER COLUMN "status" TYPE "ContentStatus" USING (
  CASE "status"::text
    WHEN 'REVIEW' THEN 'PENDING_REVIEW'
    ELSE "status"::text
  END
)::"ContentStatus";

ALTER TABLE "lessons" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "LessonStatus";
