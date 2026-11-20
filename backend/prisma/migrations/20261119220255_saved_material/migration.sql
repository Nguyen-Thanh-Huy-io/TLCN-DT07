-- CreateEnum
CREATE TYPE "SavedMaterialKind" AS ENUM ('ARTICLE', 'LESSON', 'TIMELINE_NODE');

-- CreateTable
CREATE TABLE "saved_materials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "SavedMaterialKind" NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_materials_user_id_kind_idx" ON "saved_materials"("user_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "saved_materials_user_id_kind_target_id_key" ON "saved_materials"("user_id", "kind", "target_id");

-- AddForeignKey
ALTER TABLE "saved_materials" ADD CONSTRAINT "saved_materials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
