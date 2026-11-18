-- CreateEnum
CREATE TYPE "NoteKind" AS ENUM ('HIGHLIGHT', 'NOTE', 'DEFINITION', 'QUESTION', 'IMPORTANT', 'SUMMARY');

-- DropIndex
DROP INDEX "notes_user_id_idx";

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "content_version" INTEGER,
ADD COLUMN     "kind" "NoteKind" NOT NULL DEFAULT 'NOTE',
ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "resolved_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notes_user_id_kind_idx" ON "notes"("user_id", "kind");

-- CreateIndex
CREATE INDEX "notes_labels_idx" ON "notes" USING GIN ("labels");

-- Ghi chú cũ chỉ tô màu (nội dung rỗng) → HIGHLIGHT; còn lại giữ NOTE.
UPDATE "notes" SET "kind" = 'HIGHLIGHT' WHERE btrim("content") = '';
