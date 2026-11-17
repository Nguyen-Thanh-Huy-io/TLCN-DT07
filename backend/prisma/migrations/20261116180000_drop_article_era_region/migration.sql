-- Gỡ Kỷ nguyên (metadata.era) và Phạm vi (metadata.region) khỏi hồ sơ bài viết.
-- Phạm vi trùng Topic gốc; Kỷ nguyên không có bộ mốc chung đúng cho cả lịch sử Việt Nam lẫn thế giới.
-- Chỉ đổi dữ liệu, không đổi schema.
UPDATE "articles"
SET "metadata" = "metadata" - 'era'::text - 'region'::text
WHERE "metadata" IS NOT NULL AND ("metadata" ? 'era' OR "metadata" ? 'region');

-- Metadata rỗng sau khi gỡ → NULL (cùng quy ước "không lưu {}" của normalizeArticleMetadata).
UPDATE "articles" SET "metadata" = NULL WHERE "metadata" = '{}'::jsonb;
