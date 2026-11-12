-- ============================================================
-- Migration: community_phase1
-- Date: 2026-11-10
-- Description: Thêm postType, counters (like/comment/view) vào blog_posts;
--              Tạo bảng post_likes, post_bookmarks, content_reports.
-- ============================================================

-- CreateEnum (nếu chưa tồn tại - enums đã được thêm vào enums.prisma)
DO $$ BEGIN
  CREATE TYPE "PostType" AS ENUM ('QUICK_POST', 'LONG_FORM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReportRiskLevel" AS ENUM ('SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReportActionTaken" AS ENUM ('NONE', 'AUTO_HIDDEN', 'CONFIRMED_REMOVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReportSource" AS ENUM ('USER_REPORT', 'AI_SCAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable: blog_posts — thêm post_type, like_count, comment_count, view_count
ALTER TABLE "blog_posts"
  ADD COLUMN "post_type"     "PostType" NOT NULL DEFAULT 'QUICK_POST',
  ADD COLUMN "like_count"    INTEGER    NOT NULL DEFAULT 0,
  ADD COLUMN "comment_count" INTEGER    NOT NULL DEFAULT 0,
  ADD COLUMN "view_count"    INTEGER    NOT NULL DEFAULT 0;

CREATE INDEX "blog_posts_post_type_idx" ON "blog_posts"("post_type");

-- CreateTable: post_likes
CREATE TABLE "post_likes" (
  "id"         TEXT         NOT NULL,
  "post_id"    TEXT         NOT NULL,
  "user_id"    TEXT         NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");
CREATE INDEX "post_likes_user_id_idx" ON "post_likes"("user_id");

ALTER TABLE "post_likes"
  ADD CONSTRAINT "post_likes_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "post_likes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: post_bookmarks
CREATE TABLE "post_bookmarks" (
  "id"         TEXT         NOT NULL,
  "post_id"    TEXT         NOT NULL,
  "user_id"    TEXT         NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_bookmarks_post_id_user_id_key" ON "post_bookmarks"("post_id", "user_id");
CREATE INDEX "post_bookmarks_user_id_idx" ON "post_bookmarks"("user_id");

ALTER TABLE "post_bookmarks"
  ADD CONSTRAINT "post_bookmarks_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "post_bookmarks_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: content_reports
CREATE TABLE "content_reports" (
  "id"            TEXT               NOT NULL,
  "target_type"   VARCHAR(20)        NOT NULL,
  "target_id"     TEXT               NOT NULL,
  "reporter_id"   TEXT,
  "source"        "ReportSource"     NOT NULL DEFAULT 'USER_REPORT',
  "risk_level"    "ReportRiskLevel"  NOT NULL DEFAULT 'SAFE',
  "ai_confidence" DOUBLE PRECISION,
  "ai_reasons"    JSONB,
  "action_taken"  "ReportActionTaken" NOT NULL DEFAULT 'NONE',
  "reviewer_id"   TEXT,
  "reviewed_at"   TIMESTAMP(3),
  "created_at"    TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");
CREATE INDEX "content_reports_action_taken_idx"           ON "content_reports"("action_taken");
CREATE INDEX "content_reports_source_idx"                 ON "content_reports"("source");
CREATE INDEX "content_reports_created_at_idx"             ON "content_reports"("created_at");

ALTER TABLE "content_reports"
  ADD CONSTRAINT "content_reports_reporter_id_fkey"
    FOREIGN KEY ("reporter_id") REFERENCES "authUser"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "content_reports_reviewer_id_fkey"
    FOREIGN KEY ("reviewer_id") REFERENCES "authUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
