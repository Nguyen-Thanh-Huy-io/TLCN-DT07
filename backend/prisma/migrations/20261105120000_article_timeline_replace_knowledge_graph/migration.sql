-- Thay mô hình Knowledge Graph (HistoricalEntity/Statement/Reference/Taxonomy/Period) bằng
-- Article + Category + Tag + Timeline/TimelineNode. Dữ liệu lịch sử cũ bị XOÁ (đã quyết định
-- 2026-11-05, có bản sao lưu prisma/backups/2026-11-05_pre_article_refactor.dump).

-- DropForeignKey
ALTER TABLE "historical_entities" DROP CONSTRAINT "historical_entities_period_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_entity_media" DROP CONSTRAINT "historical_entity_media_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_events" DROP CONSTRAINT "historical_events_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_events" DROP CONSTRAINT "historical_events_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_references" DROP CONSTRAINT "historical_references_format_term_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_references" DROP CONSTRAINT "historical_references_nature_term_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_sites" DROP CONSTRAINT "historical_sites_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_sites" DROP CONSTRAINT "historical_sites_preservation_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_sites" DROP CONSTRAINT "historical_sites_rank_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_sites" DROP CONSTRAINT "historical_sites_site_type_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statement_references" DROP CONSTRAINT "historical_statement_references_reference_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statement_references" DROP CONSTRAINT "historical_statement_references_statement_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "historical_statements_object_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "historical_statements_predicate_id_fkey";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "historical_statements_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "periods" DROP CONSTRAINT "periods_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "periods" DROP CONSTRAINT "periods_period_type_id_fkey";

-- DropForeignKey
ALTER TABLE "periods" DROP CONSTRAINT "periods_region_id_fkey";

-- DropForeignKey
ALTER TABLE "persons" DROP CONSTRAINT "persons_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "taxonomy_predicate_rules" DROP CONSTRAINT "taxonomy_predicate_rules_predicate_term_id_fkey";

-- DropForeignKey
ALTER TABLE "taxonomy_terms" DROP CONSTRAINT "taxonomy_terms_group_code_fkey";

-- DropForeignKey
ALTER TABLE "taxonomy_terms" DROP CONSTRAINT "taxonomy_terms_parent_id_fkey";

-- DropTable
DROP TABLE "historical_entities";

-- DropTable
DROP TABLE "historical_entity_media";

-- DropTable
DROP TABLE "historical_events";

-- DropTable
DROP TABLE "historical_references";

-- DropTable
DROP TABLE "historical_sites";

-- DropTable
DROP TABLE "historical_statement_references";

-- DropTable
DROP TABLE "historical_statements";

-- DropTable
DROP TABLE "periods";

-- DropTable
DROP TABLE "persons";

-- DropTable
DROP TABLE "taxonomy_groups";

-- DropTable
DROP TABLE "taxonomy_predicate_rules";

-- DropTable
DROP TABLE "taxonomy_terms";

-- DropEnum
DROP TYPE "HistoricalEntityType";

-- DropEnum
DROP TYPE "MediaType";

-- DropEnum
DROP TYPE "StatementRank";

-- DropEnum
DROP TYPE "StatementValueType";

-- DropEnum
DROP TYPE "VerificationStatus";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "cover_image_url" VARCHAR(500),
    "cover_caption" VARCHAR(255),
    "content_blocks" JSONB NOT NULL DEFAULT '[]',
    "date_text" VARCHAR(150),
    "start_year" INTEGER,
    "end_year" INTEGER,
    "date_precision" "DatePrecision",
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "article_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "timelines" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_nodes" (
    "id" TEXT NOT NULL,
    "timeline_id" TEXT NOT NULL,
    "article_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "date_text" VARCHAR(150),
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "end_year" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_display_order_idx" ON "categories"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_category_id_idx" ON "articles"("category_id");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_is_featured_idx" ON "articles"("is_featured");

-- CreateIndex
CREATE INDEX "articles_start_year_end_year_idx" ON "articles"("start_year", "end_year");

-- CreateIndex
CREATE INDEX "articles_updated_at_idx" ON "articles"("updated_at");

-- CreateIndex
CREATE INDEX "article_tags_tag_id_idx" ON "article_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "timelines_slug_key" ON "timelines"("slug");

-- CreateIndex
CREATE INDEX "timelines_status_idx" ON "timelines"("status");

-- CreateIndex
CREATE INDEX "timelines_display_order_idx" ON "timelines"("display_order");

-- CreateIndex
CREATE INDEX "timeline_nodes_timeline_id_display_order_idx" ON "timeline_nodes"("timeline_id", "display_order");

-- CreateIndex
CREATE INDEX "timeline_nodes_article_id_idx" ON "timeline_nodes"("article_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "timelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Hàm trigger đồng bộ cột mã taxonomy -> id (bảng đã xoá nên hàm mồ côi)
DROP FUNCTION IF EXISTS "fill_person_role_ids"() CASCADE;
DROP FUNCTION IF EXISTS "fill_entity_relation_type_id"() CASCADE;
DROP FUNCTION IF EXISTS "fill_event_relation_type_id"() CASCADE;
DROP FUNCTION IF EXISTS "taxonomy_term_id"(text, text) CASCADE;

-- Bản sửa / lịch sử phiên bản của các loại nội dung không còn tồn tại
DELETE FROM "content_revisions" WHERE "content_type" IN ('EVENT', 'ENTITY', 'PERIOD');
