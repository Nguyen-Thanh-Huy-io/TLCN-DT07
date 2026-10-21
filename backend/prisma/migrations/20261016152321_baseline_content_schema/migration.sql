/*
  Warnings:

  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobFollowUp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobReminder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobTimelineEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "LearningPathType" AS ENUM ('CHRONOLOGICAL', 'THEMATIC', 'MYTHOLOGICAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_authId_fkey";

-- DropForeignKey
ALTER TABLE "JobDocument" DROP CONSTRAINT "JobDocument_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobFollowUp" DROP CONSTRAINT "JobFollowUp_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobNote" DROP CONSTRAINT "JobNote_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobReminder" DROP CONSTRAINT "JobReminder_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobTimelineEvent" DROP CONSTRAINT "JobTimelineEvent_jobId_fkey";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "JobDocument";

-- DropTable
DROP TABLE "JobFollowUp";

-- DropTable
DROP TABLE "JobNote";

-- DropTable
DROP TABLE "JobReminder";

-- DropTable
DROP TABLE "JobTimelineEvent";

-- DropEnum
DROP TYPE "AppliedVia";

-- DropEnum
DROP TYPE "FollowUpStatus";

-- DropEnum
DROP TYPE "FollowUpType";

-- DropEnum
DROP TYPE "InterviewType";

-- DropEnum
DROP TYPE "JobDocumentType";

-- DropEnum
DROP TYPE "JobLocationType";

-- DropEnum
DROP TYPE "JobPriority";

-- DropEnum
DROP TYPE "JobReminderType";

-- DropEnum
DROP TYPE "JobSourceType";

-- DropEnum
DROP TYPE "JobStatus";

-- DropEnum
DROP TYPE "JobTimelineEventType";

-- DropEnum
DROP TYPE "ReminderStatus";

-- DropEnum
DROP TYPE "ResponseStatus";

-- CreateTable
CREATE TABLE "historical_events" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "event_year" INTEGER NOT NULL,
    "event_date_note" VARCHAR(100),
    "description" TEXT,
    "location" VARCHAR(255),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historical_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content_rich_text" TEXT,
    "thumbnail_url" VARCHAR(500),
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "source_reference_note" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" TEXT,
    "published_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_media" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(255),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periods" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "region" VARCHAR(100),
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
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
    "lesson_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_tags_pkey" PRIMARY KEY ("lesson_id","tag_id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "period_id" TEXT,
    "parent_id" TEXT,
    "path_type" "LearningPathType" NOT NULL DEFAULT 'CHRONOLOGICAL',
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "is_sequential" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historical_events_topic_id_idx" ON "historical_events"("topic_id");

-- CreateIndex
CREATE INDEX "historical_events_event_year_idx" ON "historical_events"("event_year");

-- CreateIndex
CREATE INDEX "historical_events_location_idx" ON "historical_events"("location");

-- CreateIndex
CREATE INDEX "historical_events_display_order_idx" ON "historical_events"("display_order");

-- CreateIndex
CREATE INDEX "lessons_topic_id_idx" ON "lessons"("topic_id");

-- CreateIndex
CREATE INDEX "lessons_status_idx" ON "lessons"("status");

-- CreateIndex
CREATE INDEX "lessons_difficulty_idx" ON "lessons"("difficulty");

-- CreateIndex
CREATE INDEX "lessons_display_order_idx" ON "lessons"("display_order");

-- CreateIndex
CREATE INDEX "lesson_media_lesson_id_idx" ON "lesson_media"("lesson_id");

-- CreateIndex
CREATE INDEX "periods_region_idx" ON "periods"("region");

-- CreateIndex
CREATE INDEX "periods_status_idx" ON "periods"("status");

-- CreateIndex
CREATE INDEX "periods_display_order_idx" ON "periods"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "lesson_tags_lesson_id_idx" ON "lesson_tags"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_tags_tag_id_idx" ON "lesson_tags"("tag_id");

-- CreateIndex
CREATE INDEX "topics_period_id_idx" ON "topics"("period_id");

-- CreateIndex
CREATE INDEX "topics_parent_id_idx" ON "topics"("parent_id");

-- CreateIndex
CREATE INDEX "topics_path_type_idx" ON "topics"("path_type");

-- CreateIndex
CREATE INDEX "topics_status_idx" ON "topics"("status");

-- CreateIndex
CREATE INDEX "topics_display_order_idx" ON "topics"("display_order");

-- AddForeignKey
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "authUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "authUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_media" ADD CONSTRAINT "lesson_media_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
