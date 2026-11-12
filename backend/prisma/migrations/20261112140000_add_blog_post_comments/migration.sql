-- ============================================================
-- Migration: add_blog_post_comments
-- Date: 2026-11-12
-- Description: Tạo bảng blog_post_comments và post_comment_likes cho Blog/Cộng đồng
-- ============================================================

-- CreateEnum: PostCommentStatus
DO $$ BEGIN
  CREATE TYPE "PostCommentStatus" AS ENUM ('VISIBLE', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable: blog_post_comments
CREATE TABLE "blog_post_comments" (
  "id"          TEXT                NOT NULL,
  "post_id"     TEXT                NOT NULL,
  "author_id"   TEXT                NOT NULL,
  "parent_id"   TEXT,
  "content"     TEXT                NOT NULL,
  "status"      "PostCommentStatus" NOT NULL DEFAULT 'VISIBLE',
  "like_count"  INTEGER             NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3)        NOT NULL,
  "deleted_at"  TIMESTAMP(3),

  CONSTRAINT "blog_post_comments_pkey" PRIMARY KEY ("id")
);

-- Indexes for blog_post_comments
CREATE INDEX "blog_post_comments_post_id_deleted_at_idx" ON "blog_post_comments"("post_id", "deleted_at");
CREATE INDEX "blog_post_comments_parent_id_idx" ON "blog_post_comments"("parent_id");

-- Foreign Keys for blog_post_comments
ALTER TABLE "blog_post_comments"
  ADD CONSTRAINT "blog_post_comments_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "blog_post_comments_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "blog_post_comments_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "blog_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: post_comment_likes
CREATE TABLE "post_comment_likes" (
  "id"         TEXT         NOT NULL,
  "comment_id" TEXT         NOT NULL,
  "user_id"    TEXT         NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "post_comment_likes_pkey" PRIMARY KEY ("id")
);

-- Indexes for post_comment_likes
CREATE UNIQUE INDEX "post_comment_likes_comment_id_user_id_key" ON "post_comment_likes"("comment_id", "user_id");
CREATE INDEX "post_comment_likes_user_id_idx" ON "post_comment_likes"("user_id");

-- Foreign Keys for post_comment_likes
ALTER TABLE "post_comment_likes"
  ADD CONSTRAINT "post_comment_likes_comment_id_fkey"
    FOREIGN KEY ("comment_id") REFERENCES "blog_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "post_comment_likes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
