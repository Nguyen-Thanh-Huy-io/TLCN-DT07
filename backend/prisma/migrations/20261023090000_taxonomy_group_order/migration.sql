-- Thứ tự nhóm trên trang CMS "Danh mục dùng chung" (trước đây cùng 0 nên xếp theo mã ABC):
-- di tích → khu vực → sự kiện → quan hệ → nhân vật. Chỉ cập nhật dữ liệu.
UPDATE "taxonomy_groups" g SET "display_order" = o.ord
FROM (VALUES
  ('SITE_TYPE', 1),
  ('PRESERVATION', 2),
  ('HERITAGE_RANK', 3),
  ('REGION', 4),
  ('EVENT_CATEGORY', 5),
  ('EVENT_ROLE', 6),
  ('EVENT_RELATION', 7),
  ('ENTITY_RELATION', 8),
  ('FIGURE_ROLE', 9)
) AS o(code, ord)
WHERE g."code" = o.code;
