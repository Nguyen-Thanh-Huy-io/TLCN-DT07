-- CreateEnum
CREATE TYPE "ArticleKind" AS ENUM ('PERSON', 'EVENT', 'LOCATION', 'DYNASTY', 'OTHER');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "kind" "ArticleKind";

-- Gán loại cho các chuyên mục gốc đang có (trước đây suy theo slug cố định trong code).
UPDATE "categories" SET "kind" = 'PERSON' WHERE "slug" = 'nhan-vat' AND "parent_id" IS NULL;
UPDATE "categories" SET "kind" = 'EVENT' WHERE "slug" = 'su-kien' AND "parent_id" IS NULL;
UPDATE "categories" SET "kind" = 'LOCATION' WHERE "slug" = 'di-tich' AND "parent_id" IS NULL;
UPDATE "categories" SET "kind" = 'DYNASTY' WHERE "slug" = 'trieu-dai' AND "parent_id" IS NULL;
