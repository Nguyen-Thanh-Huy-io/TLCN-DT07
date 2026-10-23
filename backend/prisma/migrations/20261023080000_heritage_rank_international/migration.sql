-- Cấp xếp hạng "Công nhận quốc tế" cho di tích ngoài Việt Nam không thuộc danh sách UNESCO
-- (Baikonur, Livadia...), đứng sau UNESCO. Chỉ thêm dữ liệu, không đổi cấu trúc bảng.
UPDATE "taxonomy_terms" SET "display_order" = "display_order" + 1
WHERE "group_code" = 'HERITAGE_RANK' AND "code" IN ('SPECIAL_NATIONAL', 'NATIONAL', 'PROVINCIAL');

INSERT INTO "taxonomy_terms" ("id", "group_code", "code", "label", "display_order", "aliases", "updated_at") VALUES
  (gen_random_uuid()::text, 'HERITAGE_RANK', 'INTERNATIONAL', 'Công nhận quốc tế', 2,
    ARRAY['quốc tế', 'di tích lịch sử quốc tế', 'di tích khoa học & vũ trụ quốc tế'], CURRENT_TIMESTAMP);

UPDATE "historical_sites" s SET "rank_id" = t."id"
FROM "taxonomy_terms" t
WHERE t."group_code" = 'HERITAGE_RANK' AND t."code" = 'INTERNATIONAL'
  AND s."rank_id" IS NULL AND lower(s."recognition_level") LIKE '%quốc tế%';
