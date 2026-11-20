-- Thêm trạng thái hoạt động (is_active) cho chuyên mục.
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
