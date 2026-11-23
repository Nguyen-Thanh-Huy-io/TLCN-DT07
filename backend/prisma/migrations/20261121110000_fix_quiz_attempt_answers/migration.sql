-- Repair legacy DB: migration 20261118100000 đã bị đánh dấu applied
-- nhưng bảng quiz_attempt_answers chưa được tạo.

CREATE TABLE IF NOT EXISTS "quiz_attempt_answers" (
  "attempt_id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "answer" JSONB,
  CONSTRAINT "quiz_attempt_answers_pkey" PRIMARY KEY ("attempt_id", "question_id")
);

CREATE INDEX IF NOT EXISTS "quiz_attempt_answers_question_id_idx"
  ON "quiz_attempt_answers"("question_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempt_answers_attempt_id_fkey'
  ) THEN
    ALTER TABLE "quiz_attempt_answers"
      ADD CONSTRAINT "quiz_attempt_answers_attempt_id_fkey"
      FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempt_answers_question_id_fkey'
  ) THEN
    ALTER TABLE "quiz_attempt_answers"
      ADD CONSTRAINT "quiz_attempt_answers_question_id_fkey"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
