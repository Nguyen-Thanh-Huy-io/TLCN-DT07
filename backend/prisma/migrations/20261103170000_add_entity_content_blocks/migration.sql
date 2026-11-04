-- AlterTable
ALTER TABLE "historical_entities" ADD COLUMN     "content_blocks" JSONB;

-- AlterTable
ALTER TABLE "persons" DROP COLUMN "biography_content";
