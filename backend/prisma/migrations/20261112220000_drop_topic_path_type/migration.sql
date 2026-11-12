-- Topic là thẻ phân loại độc lập với lộ trình → không mang "kiểu lộ trình" (chỉ LearningPath có).
-- Bỏ cột trước, rồi mới đổi enum (cột còn giữ kiểu cũ sẽ chặn DROP TYPE).
DROP INDEX IF EXISTS "topics_path_type_idx";
ALTER TABLE "topics" DROP COLUMN IF EXISTS "path_type";

-- AlterEnum: bỏ MYTHOLOGICAL (không bản ghi nào dùng)
CREATE TYPE "LearningPathType_new" AS ENUM ('CHRONOLOGICAL', 'THEMATIC');
ALTER TABLE "learning_paths" ALTER COLUMN "path_type" DROP DEFAULT;
ALTER TABLE "learning_paths" ALTER COLUMN "path_type" TYPE "LearningPathType_new" USING ("path_type"::text::"LearningPathType_new");
ALTER TYPE "LearningPathType" RENAME TO "LearningPathType_old";
ALTER TYPE "LearningPathType_new" RENAME TO "LearningPathType";
DROP TYPE "LearningPathType_old";
ALTER TABLE "learning_paths" ALTER COLUMN "path_type" SET DEFAULT 'CHRONOLOGICAL';
