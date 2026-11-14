-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ArticleCommentStatus" AS ENUM ('VISIBLE', 'REMOVED');

-- CreateEnum
CREATE TYPE "DiscussionTargetType" AS ENUM ('LESSON', 'ARTICLE');

-- CreateEnum
CREATE TYPE "userRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "userStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "mfaMethod" AS ENUM ('totp', 'sms', 'email', 'webauthn');

-- CreateEnum
CREATE TYPE "loginAction" AS ENUM ('login', 'logout');

-- CreateEnum
CREATE TYPE "email_type" AS ENUM ('verification', 'password_reset', 'notification');

-- CreateEnum
CREATE TYPE "email_provider" AS ENUM ('sendgrid', 'mailgun', 'ses', 'smtp');

-- CreateEnum
CREATE TYPE "email_status" AS ENUM ('sent', 'failed', 'pending', 'bounced', 'delivered', 'opened', 'clicked');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "LearningPathType" AS ENUM ('CHRONOLOGICAL', 'THEMATIC');

-- CreateEnum
CREATE TYPE "TopicIcon" AS ENUM ('Landmark', 'Castle', 'Swords', 'Scale', 'BookOpen', 'MapPin');

-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('DAY', 'MONTH', 'YEAR', 'DECADE', 'CENTURY', 'APPROXIMATE', 'RANGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ArticleKind" AS ENUM ('PERSON', 'EVENT', 'LOCATION', 'DYNASTY', 'OTHER');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('QUICK_POST', 'LONG_FORM');

-- CreateEnum
CREATE TYPE "ReportRiskLevel" AS ENUM ('SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportActionTaken" AS ENUM ('NONE', 'AUTO_HIDDEN', 'CONFIRMED_REMOVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('USER_REPORT', 'AI_SCAN');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('POST', 'COMMENT');

-- CreateEnum
CREATE TYPE "PostCommentStatus" AS ENUM ('VISIBLE', 'REMOVED');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NoteTargetType" AS ENUM ('ARTICLE', 'LESSON');

-- CreateEnum
CREATE TYPE "NoteColor" AS ENUM ('YELLOW', 'GREEN', 'BLUE', 'PINK', 'PURPLE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_QUESTION', 'NEW_REPLY', 'OFFICIAL_REPLY', 'BLOG_COMMENT', 'CONTENT_APPROVED', 'CONTENT_REJECTED', 'POST_LIKED', 'NEW_FOLLOWER', 'CONTENT_VIOLATION');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "kind" "ArticleKind",
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "topic_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "cover_image_url" VARCHAR(500),
    "cover_caption" VARCHAR(255),
    "content_blocks" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "date_text" VARCHAR(150),
    "start_year" INTEGER,
    "end_year" INTEGER,
    "date_precision" "DatePrecision",
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "approved_by" TEXT,
    "rejection_reason" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "article_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "article_links" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "label" VARCHAR(100),
    "note" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_comments" (
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

-- CreateTable
CREATE TABLE "authUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "userRole" NOT NULL DEFAULT 'USER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "userStatus" NOT NULL DEFAULT 'ACTIVE',
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'local',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authSecurity" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastFailedAt" TIMESTAMP(3),
    "lockExpiresAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaMethod" "mfaMethod",
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastPasswordChange" TIMESTAMP(3),

    CONSTRAINT "authSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "post_type" "PostType" NOT NULL DEFAULT 'QUICK_POST',
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" TEXT,
    "cover_image_url" VARCHAR(500),
    "content_blocks" JSONB NOT NULL DEFAULT '[]',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_bookmarks" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "source" "ReportSource" NOT NULL DEFAULT 'USER_REPORT',
    "risk_level" "ReportRiskLevel" NOT NULL DEFAULT 'SAFE',
    "ai_confidence" DOUBLE PRECISION,
    "ai_reasons" JSONB,
    "action_taken" "ReportActionTaken" NOT NULL DEFAULT 'NONE',
    "reviewer_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "status" "PostCommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "blog_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" TEXT NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "content_id" TEXT NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "base_payload" JSONB,
    "author_id" TEXT,
    "reviewer_id" TEXT,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_threads" (
    "id" TEXT NOT NULL,
    "target_type" "DiscussionTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "learning_path_id" TEXT,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_answered" BOOLEAN NOT NULL DEFAULT false,
    "upvotes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussion_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_replies" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussion_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loginHistory" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "device_id" TEXT,
    "geo_country" TEXT,
    "geo_city" TEXT,
    "action" "loginAction" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emailHistory" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "emailTo" TEXT NOT NULL,
    "emailType" "email_type" NOT NULL,
    "subject" TEXT NOT NULL,
    "emailProvider" "email_provider",
    "messageId" TEXT NOT NULL,
    "emailStatus" "email_status" NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emailHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "learning_path_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "path_type" "LearningPathType" NOT NULL DEFAULT 'CHRONOLOGICAL',
    "is_sequential" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "learning_path_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_lessons" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapter_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL DEFAULT '[]',
    "content_rich_text" TEXT,
    "thumbnail_url" VARCHAR(500),
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "source_reference_note" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "approved_by" TEXT,
    "published_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "target_type" "NoteTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_id" VARCHAR(100),
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "highlight_text" TEXT,
    "color" "NoteColor" NOT NULL DEFAULT 'YELLOW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'NEW_REPLY',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userProfile" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "title" VARCHAR(255),
    "description" TEXT,
    "passing_score_percent" INTEGER,
    "time_limit_minutes" INTEGER DEFAULT 15,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT,
    "learner_name" VARCHAR(150),
    "score_percent" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "is_passed" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "points" INTEGER NOT NULL DEFAULT 10,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "quiz_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 10,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("quiz_id","question_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color_hex" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_tags" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timelines" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_nodes" (
    "id" TEXT NOT NULL,
    "timeline_id" TEXT NOT NULL,
    "article_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "date_text" VARCHAR(150),
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "end_year" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "eyebrow" VARCHAR(100),
    "icon" "TopicIcon",
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "is_sequential" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LessonToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LessonToQuestion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TopicQuizzes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TopicQuizzes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_QuestionToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuestionToTopic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_display_order_idx" ON "categories"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_category_id_idx" ON "articles"("category_id");

-- CreateIndex
CREATE INDEX "articles_topic_id_idx" ON "articles"("topic_id");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_is_featured_idx" ON "articles"("is_featured");

-- CreateIndex
CREATE INDEX "articles_start_year_end_year_idx" ON "articles"("start_year", "end_year");

-- CreateIndex
CREATE INDEX "articles_updated_at_idx" ON "articles"("updated_at");

-- CreateIndex
CREATE INDEX "articles_metadata_idx" ON "articles" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "article_tags_tag_id_idx" ON "article_tags"("tag_id");

-- CreateIndex
CREATE INDEX "article_links_target_id_idx" ON "article_links"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_links_source_id_target_id_key" ON "article_links"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "article_comments_article_id_deleted_at_idx" ON "article_comments"("article_id", "deleted_at");

-- CreateIndex
CREATE INDEX "article_comments_parent_id_idx" ON "article_comments"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "authUser_email_key" ON "authUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "authUser_username_key" ON "authUser"("username");

-- CreateIndex
CREATE INDEX "authUser_email_id_providerId_idx" ON "authUser"("email", "id", "providerId");

-- CreateIndex
CREATE INDEX "authUser_username_idx" ON "authUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "authSecurity_authId_key" ON "authSecurity"("authId");

-- CreateIndex
CREATE INDEX "authSecurity_authId_idx" ON "authSecurity"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts"("author_id");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_post_type_idx" ON "blog_posts"("post_type");

-- CreateIndex
CREATE INDEX "blog_posts_is_featured_idx" ON "blog_posts"("is_featured");

-- CreateIndex
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts"("published_at");

-- CreateIndex
CREATE INDEX "post_likes_user_id_idx" ON "post_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "post_bookmarks_user_id_idx" ON "post_bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_bookmarks_post_id_user_id_key" ON "post_bookmarks"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "content_reports_action_taken_idx" ON "content_reports"("action_taken");

-- CreateIndex
CREATE INDEX "content_reports_source_idx" ON "content_reports"("source");

-- CreateIndex
CREATE INDEX "content_reports_created_at_idx" ON "content_reports"("created_at");

-- CreateIndex
CREATE INDEX "user_follows_follower_id_idx" ON "user_follows"("follower_id");

-- CreateIndex
CREATE INDEX "user_follows_following_id_idx" ON "user_follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_follower_id_following_id_key" ON "user_follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "blog_post_comments_post_id_deleted_at_idx" ON "blog_post_comments"("post_id", "deleted_at");

-- CreateIndex
CREATE INDEX "blog_post_comments_parent_id_idx" ON "blog_post_comments"("parent_id");

-- CreateIndex
CREATE INDEX "post_comment_likes_user_id_idx" ON "post_comment_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_comment_likes_comment_id_user_id_key" ON "post_comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "content_revisions_content_type_content_id_created_at_idx" ON "content_revisions"("content_type", "content_id", "created_at");

-- CreateIndex
CREATE INDEX "content_revisions_kind_status_idx" ON "content_revisions"("kind", "status");

-- CreateIndex
CREATE INDEX "discussion_threads_target_type_target_id_idx" ON "discussion_threads"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "discussion_threads_learning_path_id_idx" ON "discussion_threads"("learning_path_id");

-- CreateIndex
CREATE INDEX "discussion_threads_user_id_idx" ON "discussion_threads"("user_id");

-- CreateIndex
CREATE INDEX "discussion_replies_thread_id_idx" ON "discussion_replies"("thread_id");

-- CreateIndex
CREATE INDEX "discussion_replies_user_id_idx" ON "discussion_replies"("user_id");

-- CreateIndex
CREATE INDEX "loginHistory_authId_createdAt_idx" ON "loginHistory"("authId", "createdAt");

-- CreateIndex
CREATE INDEX "emailHistory_authId_idx" ON "emailHistory"("authId");

-- CreateIndex
CREATE INDEX "emailHistory_emailTo_idx" ON "emailHistory"("emailTo");

-- CreateIndex
CREATE INDEX "emailHistory_sentAt_idx" ON "emailHistory"("sentAt");

-- CreateIndex
CREATE INDEX "emailHistory_messageId_idx" ON "emailHistory"("messageId");

-- CreateIndex
CREATE INDEX "learning_path_enrollments_learning_path_id_idx" ON "learning_path_enrollments"("learning_path_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_enrollments_user_id_learning_path_id_key" ON "learning_path_enrollments"("user_id", "learning_path_id");

-- CreateIndex
CREATE INDEX "lesson_progress_lesson_id_idx" ON "lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_user_id_lesson_id_key" ON "lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths"("slug");

-- CreateIndex
CREATE INDEX "learning_paths_path_type_idx" ON "learning_paths"("path_type");

-- CreateIndex
CREATE INDEX "learning_paths_status_idx" ON "learning_paths"("status");

-- CreateIndex
CREATE INDEX "learning_paths_display_order_idx" ON "learning_paths"("display_order");

-- CreateIndex
CREATE INDEX "chapters_learning_path_id_idx" ON "chapters"("learning_path_id");

-- CreateIndex
CREATE INDEX "chapters_display_order_idx" ON "chapters"("display_order");

-- CreateIndex
CREATE INDEX "chapter_lessons_chapter_id_idx" ON "chapter_lessons"("chapter_id");

-- CreateIndex
CREATE INDEX "chapter_lessons_lesson_id_idx" ON "chapter_lessons"("lesson_id");

-- CreateIndex
CREATE INDEX "chapter_lessons_display_order_idx" ON "chapter_lessons"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_lessons_chapter_id_lesson_id_key" ON "chapter_lessons"("chapter_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

-- CreateIndex
CREATE INDEX "lessons_topic_id_idx" ON "lessons"("topic_id");

-- CreateIndex
CREATE INDEX "lessons_status_idx" ON "lessons"("status");

-- CreateIndex
CREATE INDEX "lessons_display_order_idx" ON "lessons"("display_order");

-- CreateIndex
CREATE INDEX "lessons_updated_at_idx" ON "lessons"("updated_at");

-- CreateIndex
CREATE INDEX "notes_target_type_target_id_idx" ON "notes"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_guest_id_idx" ON "notes"("guest_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "userProfile_authId_key" ON "userProfile"("authId");

-- CreateIndex
CREATE INDEX "userProfile_authId_idx" ON "userProfile"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_lesson_id_key" ON "quizzes"("lesson_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_created_at_idx" ON "quiz_attempts"("created_at");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "quiz_questions_quiz_id_display_order_idx" ON "quiz_questions"("quiz_id", "display_order");

-- CreateIndex
CREATE INDEX "quiz_questions_question_id_idx" ON "quiz_questions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "lesson_tags_lesson_id_idx" ON "lesson_tags"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_tags_tag_id_idx" ON "lesson_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_tags_lesson_id_tag_id_key" ON "lesson_tags"("lesson_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "timelines_slug_key" ON "timelines"("slug");

-- CreateIndex
CREATE INDEX "timelines_topic_id_idx" ON "timelines"("topic_id");

-- CreateIndex
CREATE INDEX "timelines_status_idx" ON "timelines"("status");

-- CreateIndex
CREATE INDEX "timelines_display_order_idx" ON "timelines"("display_order");

-- CreateIndex
CREATE INDEX "timeline_nodes_timeline_id_display_order_idx" ON "timeline_nodes"("timeline_id", "display_order");

-- CreateIndex
CREATE INDEX "timeline_nodes_article_id_idx" ON "timeline_nodes"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "topics_parent_id_idx" ON "topics"("parent_id");

-- CreateIndex
CREATE INDEX "topics_status_idx" ON "topics"("status");

-- CreateIndex
CREATE INDEX "topics_is_featured_idx" ON "topics"("is_featured");

-- CreateIndex
CREATE INDEX "topics_display_order_idx" ON "topics"("display_order");

-- CreateIndex
CREATE INDEX "_LessonToQuestion_B_index" ON "_LessonToQuestion"("B");

-- CreateIndex
CREATE INDEX "_TopicQuizzes_B_index" ON "_TopicQuizzes"("B");

-- CreateIndex
CREATE INDEX "_QuestionToTopic_B_index" ON "_QuestionToTopic"("B");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_links" ADD CONSTRAINT "article_links_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_links" ADD CONSTRAINT "article_links_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "article_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authSecurity" ADD CONSTRAINT "authSecurity_authId_fkey" FOREIGN KEY ("authId") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "authUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "authUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comment_likes" ADD CONSTRAINT "post_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "blog_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comment_likes" ADD CONSTRAINT "post_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loginHistory" ADD CONSTRAINT "loginHistory_authId_fkey" FOREIGN KEY ("authId") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emailHistory" ADD CONSTRAINT "emailHistory_authId_fkey" FOREIGN KEY ("authId") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "learning_path_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "learning_path_enrollments_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_lessons" ADD CONSTRAINT "chapter_lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_lessons" ADD CONSTRAINT "chapter_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userProfile" ADD CONSTRAINT "userProfile_authId_fkey" FOREIGN KEY ("authId") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelines" ADD CONSTRAINT "timelines_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "timelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonToQuestion" ADD CONSTRAINT "_LessonToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonToQuestion" ADD CONSTRAINT "_LessonToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TopicQuizzes" ADD CONSTRAINT "_TopicQuizzes_A_fkey" FOREIGN KEY ("A") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TopicQuizzes" ADD CONSTRAINT "_TopicQuizzes_B_fkey" FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToTopic" ADD CONSTRAINT "_QuestionToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToTopic" ADD CONSTRAINT "_QuestionToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
