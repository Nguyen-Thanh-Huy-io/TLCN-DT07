-- Repair legacy DB: 20261114100000 và 20261114080000 đã bị đánh dấu applied
-- nhưng các bảng nối Quiz-Topic / Quiz-Question chưa tồn tại.

CREATE TABLE IF NOT EXISTS "_TopicQuizzes" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_TopicQuizzes_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX IF NOT EXISTS "_TopicQuizzes_B_index" ON "_TopicQuizzes"("B");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_TopicQuizzes_A_fkey'
  ) THEN
    ALTER TABLE "_TopicQuizzes"
      ADD CONSTRAINT "_TopicQuizzes_A_fkey"
      FOREIGN KEY ("A") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_TopicQuizzes_B_fkey'
  ) THEN
    ALTER TABLE "_TopicQuizzes"
      ADD CONSTRAINT "_TopicQuizzes_B_fkey"
      FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "quiz_questions" (
  "quiz_id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "points" DOUBLE PRECISION NOT NULL DEFAULT 10,
  CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("quiz_id", "question_id")
);

CREATE INDEX IF NOT EXISTS "quiz_questions_quiz_id_display_order_idx"
  ON "quiz_questions"("quiz_id", "display_order");
CREATE INDEX IF NOT EXISTS "quiz_questions_question_id_idx"
  ON "quiz_questions"("question_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_quiz_id_fkey'
  ) THEN
    ALTER TABLE "quiz_questions"
      ADD CONSTRAINT "quiz_questions_quiz_id_fkey"
      FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_question_id_fkey'
  ) THEN
    ALTER TABLE "quiz_questions"
      ADD CONSTRAINT "quiz_questions_question_id_fkey"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'lesson_id'
  ) THEN
    INSERT INTO "_TopicQuizzes" ("A", "B")
    SELECT q."id", l."topic_id"
      FROM "quizzes" q
      JOIN "lessons" l ON l."id" = q."lesson_id"
     WHERE l."topic_id" IS NOT NULL
    ON CONFLICT DO NOTHING;

    ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "quizzes_lesson_id_fkey";
    DROP INDEX IF EXISTS "quizzes_lesson_id_key";
    ALTER TABLE "quizzes" DROP COLUMN "lesson_id";
  END IF;
END $$;

ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "questions";
