-- CreateTable
CREATE TABLE "article_links" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "label" VARCHAR(100),
    "note" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_links_target_id_idx" ON "article_links"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_links_source_id_target_id_key" ON "article_links"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "articles_metadata_idx" ON "articles" USING GIN ("metadata");

-- AddForeignKey
ALTER TABLE "article_links" ADD CONSTRAINT "article_links_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_links" ADD CONSTRAINT "article_links_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bài không được liên kết tới chính nó (Prisma không mô hình hoá CHECK; service cũng kiểm tra)
ALTER TABLE "article_links" ADD CONSTRAINT "article_links_no_self_link" CHECK ("source_id" <> "target_id");
