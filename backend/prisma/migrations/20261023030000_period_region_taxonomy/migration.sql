-- AlterTable
ALTER TABLE "periods" ADD COLUMN     "region_id" TEXT;

-- CreateIndex
CREATE INDEX "periods_region_id_idx" ON "periods"("region_id");

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ================================
-- Nhóm REGION (có phân cấp) + gắn khu vực cho các giai đoạn
-- ================================
-- Nhãn giữ đúng chữ đang lưu để giao diện không đổi; "Toàn quốc" là alias của Việt Nam.
-- Việt Nam để ở gốc (meta.domestic) vì giao diện tách "Việt Nam" / "Thế giới".
INSERT INTO "taxonomy_groups" ("code", "label", "description", "multi_valued", "hierarchical", "display_order") VALUES
  ('REGION', 'Quốc gia / khu vực', 'Phạm vi địa lý của giai đoạn lịch sử — dùng cho bộ lọc Dòng thời gian, Giai đoạn, Nhân vật, Trang chủ.', false, true, 0);

INSERT INTO "taxonomy_terms" ("id", "group_code", "code", "label", "display_order", "aliases", "meta", "updated_at") VALUES
  (gen_random_uuid()::text, 'REGION', 'VIETNAM', 'Việt Nam', 1, ARRAY['việt nam', 'toàn quốc', 'vn'], '{"domestic": true}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'REGION', 'WORLD', 'Thế giới', 2, ARRAY['thế giới', 'toàn cầu'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'REGION', 'SOVIET_UNION', 'Liên Xô', 3, ARRAY['liên xô', 'liên bang xô viết'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'REGION', 'SOUTHEAST_ASIA', 'Đông Nam Á', 4, ARRAY['đông nam á'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'REGION', 'ASIA', 'Châu Á', 5, ARRAY['châu á'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'REGION', 'EUROPE_MEDITERRANEAN', 'Châu Âu & Địa Trung Hải', 6, ARRAY['châu âu & địa trung hải'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'REGION', 'EUROPE_NORTH_AMERICA', 'Châu Âu & Bắc Mỹ', 7, ARRAY['châu âu & bắc mỹ'], NULL, CURRENT_TIMESTAMP);

UPDATE "taxonomy_terms" c SET "parent_id" = p."id"
FROM "taxonomy_terms" p
WHERE c."group_code" = 'REGION' AND p."group_code" = 'REGION'
  AND p."code" = CASE c."code"
    WHEN 'SOUTHEAST_ASIA' THEN 'ASIA'
    WHEN 'ASIA' THEN 'WORLD'
    WHEN 'EUROPE_MEDITERRANEAN' THEN 'WORLD'
    WHEN 'EUROPE_NORTH_AMERICA' THEN 'WORLD'
    WHEN 'SOVIET_UNION' THEN 'WORLD'
  END;

UPDATE "periods" pe SET "region_id" = t."id"
FROM "taxonomy_terms" t
WHERE t."group_code" = 'REGION'
  AND pe."region" IS NOT NULL
  AND (lower(trim(pe."region")) = lower(t."label") OR lower(trim(pe."region")) = ANY (t."aliases"));
