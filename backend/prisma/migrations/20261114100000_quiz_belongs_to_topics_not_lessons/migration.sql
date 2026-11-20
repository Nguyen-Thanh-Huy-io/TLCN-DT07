-- Đề thi thuộc Chủ đề, không gắn Bài học (2026-11-14).
-- Ôn tập trong bài học dùng khối QUIZ của Block Builder; đề thi (có chấm điểm, lưu kết quả) thuộc Topic.
-- Đề đang gắn bài học được chuyển sang gắn chủ đề của bài đó trước khi bỏ cột — không mất đề, không mất câu.

-- "_TopicQuizzes": A = quizzes.id, B = topics.id
INSERT INTO "_TopicQuizzes" ("A", "B")
SELECT q."id", l."topic_id"
  FROM "quizzes" q
  JOIN "lessons" l ON l."id" = q."lesson_id"
 WHERE l."topic_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_lesson_id_fkey";

-- DropIndex
DROP INDEX "quizzes_lesson_id_key";

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "lesson_id";
