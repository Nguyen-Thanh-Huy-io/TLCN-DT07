-- CreateEnum
CREATE TYPE "HistoricalEntityType" AS ENUM ('PERSON', 'ORGANIZATION', 'DYNASTY', 'MILITARY_FORCE', 'ARTIFACT', 'OTHER');

-- CreateTable
CREATE TABLE "historical_entities" (
    "id" TEXT NOT NULL,
    "period_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "type" "HistoricalEntityType" NOT NULL DEFAULT 'PERSON',
    "tagline" VARCHAR(255),
    "biography" TEXT,
    "image_url" VARCHAR(500),
    "birth_year" INTEGER,
    "death_year" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historical_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "historical_entities_slug_key" ON "historical_entities"("slug");

-- CreateIndex
CREATE INDEX "historical_entities_type_idx" ON "historical_entities"("type");

-- CreateIndex
CREATE INDEX "historical_entities_period_id_idx" ON "historical_entities"("period_id");

-- CreateIndex
CREATE INDEX "historical_entities_status_idx" ON "historical_entities"("status");

-- CreateIndex
CREATE INDEX "historical_entities_is_featured_idx" ON "historical_entities"("is_featured");

-- CreateIndex
CREATE INDEX "historical_entities_display_order_idx" ON "historical_entities"("display_order");

-- AddForeignKey
ALTER TABLE "historical_entities" ADD CONSTRAINT "historical_entities_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

