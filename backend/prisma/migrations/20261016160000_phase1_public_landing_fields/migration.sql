-- CreateEnum
CREATE TYPE "TopicIcon" AS ENUM ('Landmark', 'Castle', 'Swords', 'Scale', 'BookOpen', 'MapPin');

-- AlterTable
ALTER TABLE "periods" ADD COLUMN     "slug" VARCHAR(255) NOT NULL,
ADD COLUMN     "time_label" VARCHAR(100);

-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "eyebrow" VARCHAR(100),
ADD COLUMN     "icon" "TopicIcon",
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "periods_slug_key" ON "periods"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "topics_is_featured_idx" ON "topics"("is_featured");

