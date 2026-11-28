-- DropColumnIfExists (đề phòng migration trước đã thêm dở dạng uuid)
ALTER TABLE "learning_paths" DROP COLUMN IF EXISTS "prerequisite_path_id" CASCADE;

-- AlterTable
ALTER TABLE "learning_paths" ADD COLUMN "prerequisite_path_id" TEXT;

-- CreateIndex
CREATE INDEX "learning_paths_prerequisite_path_id_idx" ON "learning_paths"("prerequisite_path_id");

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_prerequisite_path_id_fkey" FOREIGN KEY ("prerequisite_path_id") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;
