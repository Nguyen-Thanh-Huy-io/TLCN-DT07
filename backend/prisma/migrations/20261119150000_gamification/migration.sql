-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACHIEVEMENT_UNLOCKED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GOAL_COMPLETED';

-- CreateEnum
CREATE TYPE "GamificationActivityType" AS ENUM ('LESSON_COMPLETED', 'QUIZ_SUBMITTED', 'FLASHCARD_REVIEWED', 'ARTICLE_READ_COMPLETED', 'MINDMAP_CREATED', 'NOTE_CREATED');

-- CreateEnum
CREATE TYPE "GoalPresetKey" AS ENUM ('PRESET_1X', 'PRESET_3X', 'PRESET_5X', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalTargetType" AS ENUM ('STUDY_DAYS', 'COMPLETE_LESSONS', 'PASS_QUIZZES', 'REVIEW_FLASHCARDS', 'READ_ARTICLES', 'ANY_ACTIVITIES');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AchievementMetricType" AS ENUM ('TOTAL_ACTIVITIES', 'CURRENT_DAY_STREAK', 'CURRENT_WEEK_STREAK', 'COMPLETED_LESSONS', 'PASSED_QUIZZES', 'READ_ARTICLES', 'REVIEWED_FLASHCARDS', 'CREATED_MINDMAPS');

-- CreateTable
CREATE TABLE "learning_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "GamificationActivityType" NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(100),
    "dedup_key" VARCHAR(180),
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "activity_date" VARCHAR(10) NOT NULL,
    "week_key" VARCHAR(10) NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "current_day_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_day_streak" INTEGER NOT NULL DEFAULT 0,
    "current_week_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_week_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" VARCHAR(10),
    "last_active_week_key" VARCHAR(10),
    "completed_lessons_count" INTEGER NOT NULL DEFAULT 0,
    "passed_quizzes_count" INTEGER NOT NULL DEFAULT 0,
    "reviewed_flashcards_count" INTEGER NOT NULL DEFAULT 0,
    "read_articles_count" INTEGER NOT NULL DEFAULT 0,
    "created_mindmaps_count" INTEGER NOT NULL DEFAULT 0,
    "created_notes_count" INTEGER NOT NULL DEFAULT 0,
    "total_activities_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_learning_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "preset_key" "GoalPresetKey" NOT NULL DEFAULT 'PRESET_3X',
    "target_type" "GoalTargetType" NOT NULL DEFAULT 'STUDY_DAYS',
    "period" "GoalPeriod" NOT NULL DEFAULT 'WEEKLY',
    "target_value" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "period_key" VARCHAR(16) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "learning_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "icon_key" VARCHAR(50) NOT NULL,
    "metric_type" "AchievementMetricType" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 20,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_activities_dedup_key_key" ON "learning_activities"("dedup_key");
CREATE INDEX "learning_activities_user_id_activity_date_idx" ON "learning_activities"("user_id", "activity_date");
CREATE INDEX "learning_activities_user_id_week_key_idx" ON "learning_activities"("user_id", "week_key");
CREATE INDEX "learning_activities_user_id_activity_type_occurred_at_idx" ON "learning_activities"("user_id", "activity_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_stats_user_id_key" ON "user_learning_stats"("user_id");

-- CreateIndex
CREATE INDEX "learning_goals_user_id_status_period_idx" ON "learning_goals"("user_id", "status", "period");
CREATE INDEX "learning_goals_user_id_is_primary_status_idx" ON "learning_goals"("user_id", "is_primary", "status");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");
CREATE INDEX "achievements_is_active_sort_order_idx" ON "achievements"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");
CREATE INDEX "user_achievements_user_id_unlocked_at_idx" ON "user_achievements"("user_id", "unlocked_at");
CREATE INDEX "user_achievements_achievement_id_idx" ON "user_achievements"("achievement_id");

-- AddForeignKey
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_stats" ADD CONSTRAINT "user_learning_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
