-- Loại quan hệ "Kết thúc bằng": sự kiện kéo dài (cuộc kháng chiến...) trỏ tới sự kiện đánh dấu
-- sự kết thúc của nó (vd. Kháng chiến chống Pháp → Hiệp định Genève 1954). Dòng thời gian dùng
-- quan hệ này cho mốc kết thúc thay vì chỉ năm kết thúc. Chỉ thêm dữ liệu danh mục.
INSERT INTO "taxonomy_terms" ("id", "group_code", "code", "label", "inverse_label", "display_order", "aliases", "updated_at")
VALUES (gen_random_uuid()::text, 'EVENT_RELATION', 'ENDED_BY', 'Kết thúc bằng', 'Đánh dấu kết thúc của', 8,
  ARRAY['kết thúc bằng', 'kết thúc'], CURRENT_TIMESTAMP)
ON CONFLICT ("group_code", "code") DO NOTHING;
