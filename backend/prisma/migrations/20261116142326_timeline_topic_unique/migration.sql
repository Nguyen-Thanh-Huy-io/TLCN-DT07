-- DropIndex
DROP INDEX "timelines_topic_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "timelines_topic_id_key" ON "timelines"("topic_id");
