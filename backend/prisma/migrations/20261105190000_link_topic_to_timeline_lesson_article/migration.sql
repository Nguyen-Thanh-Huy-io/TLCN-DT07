-- AlterTable
ALTER TABLE "timelines" ADD COLUMN "topic_id" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "topic_id" TEXT;

-- AlterTable
ALTER TABLE "articles" ADD COLUMN "topic_id" TEXT;

-- CreateIndex
CREATE INDEX "timelines_topic_id_idx" ON "timelines"("topic_id");

-- CreateIndex
CREATE INDEX "lessons_topic_id_idx" ON "lessons"("topic_id");

-- CreateIndex
CREATE INDEX "articles_topic_id_idx" ON "articles"("topic_id");

-- AddForeignKey
ALTER TABLE "timelines" ADD CONSTRAINT "timelines_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
