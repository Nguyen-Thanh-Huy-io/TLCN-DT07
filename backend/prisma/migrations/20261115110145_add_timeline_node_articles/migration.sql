-- CreateTable
CREATE TABLE "timeline_node_articles" (
    "node_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_node_articles_pkey" PRIMARY KEY ("node_id","article_id")
);

-- CreateIndex
CREATE INDEX "timeline_node_articles_article_id_idx" ON "timeline_node_articles"("article_id");

-- AddForeignKey
ALTER TABLE "timeline_node_articles" ADD CONSTRAINT "timeline_node_articles_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "timeline_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_node_articles" ADD CONSTRAINT "timeline_node_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
