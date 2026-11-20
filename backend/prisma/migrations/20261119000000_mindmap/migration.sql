-- CreateTable
CREATE TABLE "study_mindmaps" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "period_label" VARCHAR(80),
    "template" VARCHAR(30) NOT NULL DEFAULT 'SPIDER',
    "graph" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "study_mindmaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_mindmaps_owner_id_updated_at_idx" ON "study_mindmaps"("owner_id", "updated_at");
