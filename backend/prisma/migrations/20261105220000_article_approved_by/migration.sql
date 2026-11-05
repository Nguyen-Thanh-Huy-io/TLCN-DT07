ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "approved_by" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
