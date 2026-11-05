-- CreateEnum
CREATE TYPE "NoteTargetType" AS ENUM ('ARTICLE', 'LESSON');

-- CreateEnum
CREATE TYPE "NoteColor" AS ENUM ('YELLOW', 'GREEN', 'BLUE', 'PINK', 'PURPLE');

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

-- CreateIndex
CREATE INDEX "notes_target_type_target_id_idx" ON "notes"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_guest_id_idx" ON "notes"("guest_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
