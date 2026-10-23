-- CreateTable
CREATE TABLE "content_revisions" (
    "id" TEXT NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "content_id" TEXT NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "author_id" TEXT,
    "reviewer_id" TEXT,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_revisions_content_type_content_id_created_at_idx" ON "content_revisions"("content_type", "content_id", "created_at");

-- CreateIndex
CREATE INDEX "content_revisions_kind_status_idx" ON "content_revisions"("kind", "status");
