-- CreateTable questions if not exists
CREATE TABLE IF NOT EXISTS "questions" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "points" INTEGER NOT NULL DEFAULT 10,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable _LessonToQuestion (Many-to-Many: Lesson <-> Question)
CREATE TABLE IF NOT EXISTS "_LessonToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LessonToQuestion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable _QuestionToTopic (Many-to-Many: Question <-> Topic)
CREATE TABLE IF NOT EXISTS "_QuestionToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuestionToTopic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "questions_type_idx" ON "questions"("type");
CREATE INDEX IF NOT EXISTS "questions_difficulty_idx" ON "questions"("difficulty");
CREATE INDEX IF NOT EXISTS "_LessonToQuestion_B_index" ON "_LessonToQuestion"("B");
CREATE INDEX IF NOT EXISTS "_QuestionToTopic_B_index" ON "_QuestionToTopic"("B");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_LessonToQuestion_A_fkey'
    ) THEN
        ALTER TABLE "_LessonToQuestion" ADD CONSTRAINT "_LessonToQuestion_A_fkey"
            FOREIGN KEY ("A") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_LessonToQuestion_B_fkey'
    ) THEN
        ALTER TABLE "_LessonToQuestion" ADD CONSTRAINT "_LessonToQuestion_B_fkey"
            FOREIGN KEY ("B") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_QuestionToTopic_A_fkey'
    ) THEN
        ALTER TABLE "_QuestionToTopic" ADD CONSTRAINT "_QuestionToTopic_A_fkey"
            FOREIGN KEY ("A") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_QuestionToTopic_B_fkey'
    ) THEN
        ALTER TABLE "_QuestionToTopic" ADD CONSTRAINT "_QuestionToTopic_B_fkey"
            FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Migrate existing single lesson_id / topic_id data into join tables before dropping columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'questions' AND column_name = 'lesson_id'
    ) THEN
        INSERT INTO "_LessonToQuestion" ("A", "B")
        SELECT q."lesson_id", q."id"
        FROM "questions" q
        INNER JOIN "lessons" l ON l."id" = q."lesson_id"
        WHERE q."lesson_id" IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'questions' AND column_name = 'topic_id'
    ) THEN
        INSERT INTO "_QuestionToTopic" ("A", "B")
        SELECT q."id", q."topic_id"
        FROM "questions" q
        INNER JOIN "topics" t ON t."id" = q."topic_id"
        WHERE q."topic_id" IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Drop legacy single-column foreign keys, indexes, and columns
ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_lesson_id_fkey";
ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_topic_id_fkey";
DROP INDEX IF EXISTS "questions_lesson_id_idx";
DROP INDEX IF EXISTS "questions_topic_id_idx";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "lesson_id";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "topic_id";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "period_id";
