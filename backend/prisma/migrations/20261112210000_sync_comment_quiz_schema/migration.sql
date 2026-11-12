-- Bù phần schema đã có trong prisma/schema nhưng chưa từng có migration (trước đây dùng db push):
--   • article_comments + enum ArticleCommentStatus
--   • các giá trị NotificationType mới
--   • bảng nối _TopicQuizzes (Quiz ↔ Topic nhiều-nhiều) — chuyển quizzes.topic_id cũ sang trước khi xoá cột
--   • bỏ các cột quiz/topic đã gỡ khỏi schema ở commit 17fc7f2
-- Mọi lệnh đều có kiểm tra tồn tại để chạy được cả trên DB đã có sẵn các đối tượng này.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ArticleCommentStatus" AS ENUM ('VISIBLE', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BLOG_COMMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONTENT_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONTENT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_LIKED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_FOLLOWER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONTENT_VIOLATION';

-- CreateTable: article_comments
CREATE TABLE IF NOT EXISTS "article_comments" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "status" "ArticleCommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "article_comments_article_id_deleted_at_idx" ON "article_comments"("article_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "article_comments_parent_id_idx" ON "article_comments"("parent_id");

DO $$ BEGIN
  ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_fkey"
    FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "article_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable: _TopicQuizzes (A = quizzes.id, B = topics.id)
CREATE TABLE IF NOT EXISTS "_TopicQuizzes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TopicQuizzes_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX IF NOT EXISTS "_TopicQuizzes_B_index" ON "_TopicQuizzes"("B");

DO $$ BEGIN
  ALTER TABLE "_TopicQuizzes" ADD CONSTRAINT "_TopicQuizzes_A_fkey"
    FOREIGN KEY ("A") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "_TopicQuizzes" ADD CONSTRAINT "_TopicQuizzes_B_fkey"
    FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Chuyển chủ đề đơn cũ (quizzes.topic_id) sang bảng nối trước khi xoá cột
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'quizzes' AND column_name = 'topic_id'
  ) THEN
    EXECUTE 'INSERT INTO "_TopicQuizzes" ("A", "B")
             SELECT "id", "topic_id" FROM "quizzes" WHERE "topic_id" IS NOT NULL
             ON CONFLICT DO NOTHING';
  END IF;
END $$;

-- DropForeignKey / DropIndex
ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "quizzes_topic_id_fkey";
-- quizzes_slug_key có thể là constraint UNIQUE (db push) hoặc index thường (migrate) tùy DB
ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "quizzes_slug_key";
DROP INDEX IF EXISTS "quizzes_slug_key";

-- AlterTable: bỏ các cột đã gỡ khỏi schema
ALTER TABLE "quizzes"
  DROP COLUMN IF EXISTS "cover_image_url",
  DROP COLUMN IF EXISTS "display_order",
  DROP COLUMN IF EXISTS "metadata",
  DROP COLUMN IF EXISTS "slug",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "topic_id";

ALTER TABLE "quiz_attempts"
  DROP COLUMN IF EXISTS "blank_count",
  DROP COLUMN IF EXISTS "metadata",
  DROP COLUMN IF EXISTS "topic_scores",
  DROP COLUMN IF EXISTS "wrong_count";

ALTER TABLE "topics" DROP COLUMN IF EXISTS "metadata";
