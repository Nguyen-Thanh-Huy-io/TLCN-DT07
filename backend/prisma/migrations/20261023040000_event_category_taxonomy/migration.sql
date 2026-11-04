-- AlterTable
ALTER TABLE "historical_events" ADD COLUMN     "category_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "historical_events_category_ids_idx" ON "historical_events" USING GIN ("category_ids");

-- ================================
-- Nhóm EVENT_CATEGORY: cây loại sự kiện, gắn được nhiều loại cho một sự kiện
-- ================================
-- meta.fields: các trường thông tin riêng của nút (kiểu text | textarea | list | number); nút con kế thừa
--   trường của mọi cấp phía trên — thay cho 3 class strategy viết tay.
-- meta.legacyCategory: giá trị ghi vào cột enum category cũ khi loại này là loại chính.
INSERT INTO "taxonomy_groups" ("code", "label", "description", "multi_valued", "hierarchical", "display_order") VALUES
  ('EVENT_CATEGORY', 'Loại sự kiện', 'Cây phân loại sự kiện. Một sự kiện gắn được nhiều loại (loại đầu là loại chính); lọc theo nút cha ra cả nút con. Trường thông tin riêng khai báo ở từng nút và kế thừa xuống.', true, true, 0);

INSERT INTO "taxonomy_terms" ("id", "group_code", "code", "label", "icon", "display_order", "aliases", "meta", "updated_at") VALUES
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'MILITARY', 'Quân sự', 'swords', 1, ARRAY['quân sự'],
    '{"fields":[{"key":"belligerents","label":"Các bên tham chiến","type":"list"},{"key":"commanders","label":"Chỉ huy","type":"list"},{"key":"strength","label":"Binh lực","type":"text"},{"key":"casualties","label":"Thương vong","type":"text"}],"legacyCategory":"WAR"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'WAR', 'Chiến tranh', 'flame', 1, ARRAY['chiến tranh', 'xung đột vũ trang', 'nội chiến'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'BATTLE', 'Trận đánh / Chiến dịch', 'swords', 2, ARRAY['trận đánh', 'chiến dịch', 'hải chiến'],
    '{"fields":[{"key":"tactics","label":"Chiến thuật","type":"textarea"}]}'::jsonb, CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'POLITICS_DIPLOMACY', 'Chính trị – Ngoại giao', 'landmark', 2, ARRAY['chính trị', 'ngoại giao'],
    '{"fields":[{"key":"participants","label":"Các bên / lực lượng tham gia","type":"list"},{"key":"leaders","label":"Người lãnh đạo","type":"list"},{"key":"keyResolutions","label":"Quyết định / kết quả then chốt","type":"textarea"}],"legacyCategory":"POLITICAL_EVENT"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'POLITICAL_EVENT', 'Biến cố chính trị', 'landmark', 1, ARRAY['biến cố chính trị', 'đảo chính'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'REVOLUTION', 'Cách mạng / Khởi nghĩa', 'flag', 2, ARRAY['cách mạng', 'khởi nghĩa', 'phong trào'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'TREATY', 'Hiệp ước / Hòa ước', 'scroll', 3, ARRAY['hiệp ước', 'hòa ước', 'hiệp định'],
    '{"fields":[{"key":"signatories","label":"Các bên ký kết","type":"list"},{"key":"ratifiedDate","label":"Ngày phê chuẩn","type":"text"},{"key":"termsSummary","label":"Tóm tắt điều khoản","type":"textarea"},{"key":"territorialChanges","label":"Thay đổi lãnh thổ","type":"textarea"}]}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'SUMMIT_CONFERENCE', 'Hội nghị thượng đỉnh', 'users', 4, ARRAY['hội nghị', 'thượng đỉnh'], NULL, CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'SOCIETY_CULTURE', 'Văn hóa – Xã hội', 'book', 3, ARRAY['văn hóa – xã hội', 'xã hội'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'CULTURE', 'Văn hóa', 'palette', 1, ARRAY['văn hóa', 'culture_science'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'RELIGION', 'Tôn giáo', 'church', 2, ARRAY['tôn giáo', 'tín ngưỡng'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'LEGEND', 'Truyền thuyết', 'sparkles', 3, ARRAY['truyền thuyết', 'thần thoại', 'sự tích'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'CONSTRUCTION', 'Công trình / Xây dựng', 'building', 4, ARRAY['công trình', 'xây dựng'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'SCIENCE_DISCOVERY', 'Khoa học – Khám phá', 'telescope', 4, ARRAY['khoa học – khám phá', 'khám phá'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'EXPLORATION', 'Phát kiến địa lý', 'compass', 1, ARRAY['phát kiến địa lý', 'thám hiểm'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'SCIENCE_TECH', 'Khoa học & Công nghệ', 'rocket', 2, ARRAY['khoa học', 'công nghệ', 'vũ trụ'], '{"legacyCategory":"CULTURE_SCIENCE"}'::jsonb, CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'NATURE_DISASTER', 'Thiên nhiên – Thảm họa', 'cloud-lightning', 5, ARRAY['thiên nhiên', 'thảm họa'], '{"legacyCategory":"NATURAL_DISASTER"}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'NATURAL_DISASTER', 'Thiên tai / Đại dịch', 'cloud-lightning', 1, ARRAY['thiên tai', 'đại dịch', 'động đất'],
    '{"fields":[{"key":"intensity","label":"Cường độ","type":"text"},{"key":"casualtiesCount","label":"Số thương vong","type":"text"},{"key":"affectedArea","label":"Vùng ảnh hưởng","type":"text"}]}'::jsonb, CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'EVENT_CATEGORY', 'OTHER', 'Khác', 'circle', 99, ARRAY['khác'], NULL, CURRENT_TIMESTAMP);

UPDATE "taxonomy_terms" c SET "parent_id" = p."id"
FROM "taxonomy_terms" p
WHERE c."group_code" = 'EVENT_CATEGORY' AND p."group_code" = 'EVENT_CATEGORY'
  AND p."code" = CASE
    WHEN c."code" IN ('WAR', 'BATTLE') THEN 'MILITARY'
    WHEN c."code" IN ('POLITICAL_EVENT', 'REVOLUTION', 'TREATY', 'SUMMIT_CONFERENCE') THEN 'POLITICS_DIPLOMACY'
    WHEN c."code" IN ('CULTURE', 'RELIGION', 'LEGEND', 'CONSTRUCTION') THEN 'SOCIETY_CULTURE'
    WHEN c."code" IN ('EXPLORATION', 'SCIENCE_TECH') THEN 'SCIENCE_DISCOVERY'
    WHEN c."code" = 'NATURAL_DISASTER' THEN 'NATURE_DISASTER'
  END;

-- Gắn loại cho sự kiện cũ: loại hiện tại → loại chính (cùng mã).
UPDATE "historical_events" e SET "category_ids" = ARRAY[t."id"]
FROM "taxonomy_terms" t
WHERE t."group_code" = 'EVENT_CATEGORY' AND t."code" = e."category"::text;

-- CULTURE_SCIENCE (giỏ tạp cũ) tách theo nội dung; loại đầu là loại chính.
CREATE TEMP TABLE "_evcat_split" ("title_prefix" TEXT, "codes" TEXT[]);
INSERT INTO "_evcat_split" VALUES
  ('Sự tích "bọc trăm trứng"', ARRAY['LEGEND']),
  ('Văn hóa Đông Sơn', ARRAY['CULTURE']),
  ('Truyền thuyết Sơn Tinh', ARRAY['LEGEND']),
  ('Xây dựng thành Cổ Loa', ARRAY['CONSTRUCTION', 'POLITICAL_EVENT']),
  ('Sĩ Nhiếp cai trị Giao Chỉ', ARRAY['POLITICAL_EVENT', 'CULTURE']),
  ('Khương Tăng Hội', ARRAY['RELIGION', 'CULTURE']),
  ('Hải trình của Christopher Columbus', ARRAY['EXPLORATION']),
  ('Liên Xô phóng thành công Sputnik', ARRAY['SCIENCE_TECH']),
  ('Chuyến bay lịch sử của Yuri Gagarin', ARRAY['SCIENCE_TECH']);

UPDATE "historical_events" e SET "category_ids" = ARRAY(
    SELECT t."id" FROM unnest(s."codes") WITH ORDINALITY AS c(code, ord)
    JOIN "taxonomy_terms" t ON t."group_code" = 'EVENT_CATEGORY' AND t."code" = c.code
    ORDER BY c.ord)
FROM "_evcat_split" s
WHERE e."category" = 'CULTURE_SCIENCE' AND e."title" LIKE s."title_prefix" || '%';

-- Phần CULTURE_SCIENCE còn lại (nếu có) → Văn hóa.
UPDATE "historical_events" SET "category_ids" = ARRAY(
    SELECT "id" FROM "taxonomy_terms" WHERE "group_code" = 'EVENT_CATEGORY' AND "code" = 'CULTURE')
WHERE "category" = 'CULTURE_SCIENCE' AND cardinality("category_ids") = 0;

-- Loại chính thuộc enum cũ (vd. Sĩ Nhiếp → Biến cố chính trị) thì cột enum theo loại chính.
UPDATE "historical_events" e SET "category" = t."code"::"EventCategory"
FROM "taxonomy_terms" t
WHERE t."id" = e."category_ids"[1] AND e."category" = 'CULTURE_SCIENCE'
  AND t."code" IN ('BATTLE', 'WAR', 'TREATY', 'REVOLUTION', 'POLITICAL_EVENT', 'SUMMIT_CONFERENCE', 'NATURAL_DISASTER', 'OTHER');

DROP TABLE "_evcat_split";
