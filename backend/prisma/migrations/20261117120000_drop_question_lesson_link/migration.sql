-- Bỏ quan hệ Câu hỏi ↔ Bài học: không chỗ nào trong bài học đọc lại (khối Ôn tập chép câu vào Lesson.content).
-- Giữ phân loại: câu hỏi từng gắn bài học nào thì gắn thêm Chủ đề của bài học đó ("A" = Lesson, "B" = Question;
-- trong _QuestionToTopic "A" = Question, "B" = Topic).
INSERT INTO "_QuestionToTopic" ("A", "B")
SELECT DISTINCT lq."B", l."topic_id"
FROM "_LessonToQuestion" lq
JOIN "lessons" l ON l."id" = lq."A"
WHERE l."topic_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "_LessonToQuestion" DROP CONSTRAINT "_LessonToQuestion_A_fkey";

-- DropForeignKey
ALTER TABLE "_LessonToQuestion" DROP CONSTRAINT "_LessonToQuestion_B_fkey";

-- DropTable
DROP TABLE "_LessonToQuestion";
