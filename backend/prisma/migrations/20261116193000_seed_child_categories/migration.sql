-- Bổ sung các chuyên mục con chuẩn dưới Sự kiện lịch sử (su-kien), Nhân vật lịch sử (nhan-vat) và Địa danh lịch sử (di-tich)
-- để bộ chọn Chuyên mục Cha → Con và bộ lọc loại sự kiện hoạt động đầy đủ.

INSERT INTO "categories" ("id", "parent_id", "name", "slug", "description", "icon", "kind", "is_active", "display_order", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  p."id",
  c.name,
  c.slug,
  c.description,
  c.icon,
  NULL,
  true,
  c.display_order,
  NOW(),
  NOW()
FROM (
  VALUES
    ('su-kien', 'Chiến dịch & Trận đánh', 'chien-dich-tran-danh', 'Các trận quyết chiến chiến lược và chiến dịch quân sự trong lịch sử.', 'swords', 1),
    ('su-kien', 'Khởi nghĩa & Cách mạng', 'khoi-nghia-cach-mang', 'Các cuộc khởi nghĩa giành độc lập và phong trào cách mạng.', 'flag', 2),
    ('su-kien', 'Hội nghị & Hiệp ước', 'hoi-nghi-hiep-uoc', 'Các hội nghị lịch sử, hiệp định ngoại giao và chiếu chỉ trọng đại.', 'scroll', 3),
    ('nhan-vat', 'Quân chủ & Hoàng tộc', 'quan-chu-hoang-toc', 'Các vị vua, hoàng đế và nhân vật hoàng thất qua các triều đại.', 'crown', 1),
    ('nhan-vat', 'Danh tướng & Anh hùng', 'danh-tuong-anh-hung', 'Các vị tướng lĩnh, tổng tư lệnh và anh hùng dân tộc.', 'shield', 2),
    ('nhan-vat', 'Danh nhân văn hóa & Học giả', 'danh-nhan-van-hoa', 'Các nhà tư tưởng, học giả, thi sĩ và danh nhân văn hóa.', 'book-open', 3),
    ('di-tich', 'Cố đô & Thành lũy', 'co-do-thanh-luy', 'Kinh đô cổ, hoàng thành và kiến trúc phòng thủ quân sự.', 'castle', 1),
    ('di-tich', 'Chiến trường & Khu tưởng niệm', 'chien-truong-tuong-niem', 'Địa danh gắn với các trận đánh lớn và khu di tích tưởng niệm.', 'landmark', 2)
) AS c(parent_slug, name, slug, description, icon, display_order)
JOIN "categories" p ON p."slug" = c.parent_slug
ON CONFLICT ("slug") DO UPDATE
SET "parent_id" = EXCLUDED."parent_id",
    "display_order" = EXCLUDED."display_order";
