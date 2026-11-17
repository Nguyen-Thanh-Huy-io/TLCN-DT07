-- CreateTable
CREATE TABLE "quiz_attempt_answers" (
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answer" JSONB,

    CONSTRAINT "quiz_attempt_answers_pkey" PRIMARY KEY ("attempt_id","question_id")
);

-- CreateIndex
CREATE INDEX "quiz_attempt_answers_question_id_idx" ON "quiz_attempt_answers"("question_id");

-- AddForeignKey
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
