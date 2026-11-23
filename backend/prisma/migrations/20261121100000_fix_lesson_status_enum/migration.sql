-- Sửa DB legacy: migration 20261114140000 đã bị đánh dấu applied ở máy cũ
-- nhưng cột lessons.status chưa được chuyển sang ContentStatus.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'status' AND udt_name = 'LessonStatus'
  ) THEN
    ALTER TABLE "lessons" ALTER COLUMN "status" DROP DEFAULT;

    ALTER TABLE "lessons" ALTER COLUMN "status" TYPE "ContentStatus" USING (
      CASE "status"::text
        WHEN 'REVIEW' THEN 'PENDING_REVIEW'
        ELSE "status"::text
      END
    )::"ContentStatus";

    ALTER TABLE "lessons" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
  END IF;

  DROP TYPE IF EXISTS "LessonStatus";
END $$;
