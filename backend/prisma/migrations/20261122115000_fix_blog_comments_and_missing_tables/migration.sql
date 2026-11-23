-- Repair legacy DB: migration baseline trước đó đánh dấu applied trên DB cũ
-- nhưng các bảng blog_post_comments, post_comment_likes, timeline_node_articles
-- và cột categories.is_active chưa được tạo.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostCommentStatus') THEN
    CREATE TYPE "PostCommentStatus" AS ENUM ('VISIBLE', 'REMOVED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "blog_post_comments" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "content" TEXT NOT NULL,
  "status" "PostCommentStatus" NOT NULL DEFAULT 'VISIBLE',
  "like_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "blog_post_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "blog_post_comments_post_id_deleted_at_idx"
  ON "blog_post_comments"("post_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "blog_post_comments_parent_id_idx"
  ON "blog_post_comments"("parent_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_post_comments_post_id_fkey'
  ) THEN
    ALTER TABLE "blog_post_comments"
      ADD CONSTRAINT "blog_post_comments_post_id_fkey"
      FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_post_comments_author_id_fkey'
  ) THEN
    ALTER TABLE "blog_post_comments"
      ADD CONSTRAINT "blog_post_comments_author_id_fkey"
      FOREIGN KEY ("author_id") REFERENCES "authUser"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_post_comments_parent_id_fkey'
  ) THEN
    ALTER TABLE "blog_post_comments"
      ADD CONSTRAINT "blog_post_comments_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "blog_post_comments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "post_comment_likes" (
  "id" TEXT NOT NULL,
  "comment_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_comment_likes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "post_comment_likes_user_id_idx"
  ON "post_comment_likes"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "post_comment_likes_comment_id_user_id_key"
  ON "post_comment_likes"("comment_id", "user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_comment_likes_comment_id_fkey'
  ) THEN
    ALTER TABLE "post_comment_likes"
      ADD CONSTRAINT "post_comment_likes_comment_id_fkey"
      FOREIGN KEY ("comment_id") REFERENCES "blog_post_comments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_comment_likes_user_id_fkey'
  ) THEN
    ALTER TABLE "post_comment_likes"
      ADD CONSTRAINT "post_comment_likes_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "authUser"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "timeline_node_articles" (
  "node_id" TEXT NOT NULL,
  "article_id" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "timeline_node_articles_pkey" PRIMARY KEY ("node_id", "article_id")
);

CREATE INDEX IF NOT EXISTS "timeline_node_articles_article_id_idx"
  ON "timeline_node_articles"("article_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'timeline_node_articles_node_id_fkey'
  ) THEN
    ALTER TABLE "timeline_node_articles"
      ADD CONSTRAINT "timeline_node_articles_node_id_fkey"
      FOREIGN KEY ("node_id") REFERENCES "timeline_nodes"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'timeline_node_articles_article_id_fkey'
  ) THEN
    ALTER TABLE "timeline_node_articles"
      ADD CONSTRAINT "timeline_node_articles_article_id_fkey"
      FOREIGN KEY ("article_id") REFERENCES "articles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
