-- CreateTable
CREATE TABLE "chapter_quizzes" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "pass_score" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapter_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chapter_quizzes_chapter_id_display_order_idx" ON "chapter_quizzes"("chapter_id", "display_order");

-- CreateIndex
CREATE INDEX "chapter_quizzes_quiz_id_idx" ON "chapter_quizzes"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_quizzes_chapter_id_quiz_id_key" ON "chapter_quizzes"("chapter_id", "quiz_id");

-- AddForeignKey
ALTER TABLE "chapter_quizzes" ADD CONSTRAINT "chapter_quizzes_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_quizzes" ADD CONSTRAINT "chapter_quizzes_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
