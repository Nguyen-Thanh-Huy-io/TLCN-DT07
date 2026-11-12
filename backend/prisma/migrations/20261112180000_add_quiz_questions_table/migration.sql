-- CreateTable quiz_questions
CREATE TABLE IF NOT EXISTS "quiz_questions" (
    "quiz_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 10,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("quiz_id","question_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "quiz_questions_quiz_id_display_order_idx" ON "quiz_questions"("quiz_id", "display_order");
CREATE INDEX IF NOT EXISTS "quiz_questions_question_id_idx" ON "quiz_questions"("question_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_quiz_id_fkey'
    ) THEN
        ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey"
            FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_question_id_fkey'
    ) THEN
        ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_question_id_fkey"
            FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
