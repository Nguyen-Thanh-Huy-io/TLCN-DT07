-- CreateEnum
CREATE TYPE "HistoricalLocationType" AS ENUM ('BATTLEFIELD', 'MONUMENT', 'ANCIENT_CAPITAL', 'CITADEL', 'TEMPLE', 'OTHER');

-- CreateTable
CREATE TABLE "historical_locations" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "historical_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "type" "HistoricalLocationType" NOT NULL DEFAULT 'OTHER',
    "address" VARCHAR(500),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "historical_significance" TEXT,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historical_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "historical_locations_slug_key" ON "historical_locations"("slug");

-- CreateIndex
CREATE INDEX "historical_locations_parent_id_idx" ON "historical_locations"("parent_id");

-- CreateIndex
CREATE INDEX "historical_locations_type_idx" ON "historical_locations"("type");

-- CreateIndex
CREATE INDEX "historical_locations_status_idx" ON "historical_locations"("status");

-- AddForeignKey
ALTER TABLE "historical_locations" ADD CONSTRAINT "historical_locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "historical_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
