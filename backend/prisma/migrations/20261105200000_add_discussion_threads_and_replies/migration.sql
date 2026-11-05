-- CreateEnum
CREATE TYPE "DiscussionTargetType" AS ENUM ('LESSON', 'ARTICLE');

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

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
