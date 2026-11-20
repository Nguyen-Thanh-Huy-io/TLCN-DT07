-- Dọn articles.metadata theo hồ sơ mới (backend/src/article/article-metadata.ts). Chỉ đổi dữ liệu, không đổi schema.

-- 1. Vai trò nhân vật thành chữ tự do: đổi các mã tiếng Anh cũ sang nhãn tiếng Việt.
WITH role_labels(code, label) AS (
  VALUES
    ('GENERAL', 'Tướng lĩnh'),
    ('COMMANDER', 'Chỉ huy'),
    ('COMMANDER_IN_CHIEF', 'Tổng tư lệnh'),
    ('STRATEGIST', 'Chiến lược gia'),
    ('MILITARY_ADVISER', 'Quân sư'),
    ('WARRIOR', 'Chiến binh'),
    ('MONARCH', 'Quân chủ'),
    ('POLITICIAN', 'Chính trị gia'),
    ('STATESMAN', 'Chính khách'),
    ('DIPLOMAT', 'Nhà ngoại giao'),
    ('REFORMER', 'Nhà cải cách'),
    ('SCHOLAR', 'Học giả'),
    ('CULTURAL_FIGURE', 'Danh nhân văn hóa'),
    ('POET', 'Thi sĩ'),
    ('WRITER', 'Nhà văn'),
    ('PHILOSOPHER', 'Triết gia'),
    ('SCIENTIST', 'Nhà khoa học'),
    ('RELIGIOUS_FIGURE', 'Nhân vật tôn giáo'),
    ('REVOLUTIONARY', 'Nhà cách mạng'),
    ('PATRIOT', 'Nhà yêu nước'),
    ('HERO', 'Anh hùng dân tộc')
)
UPDATE "articles" a
SET "metadata" = jsonb_set(
  a."metadata",
  '{person,roles}',
  (
    SELECT jsonb_agg(COALESCE(rl.label, r.value) ORDER BY r.ord)
    FROM jsonb_array_elements_text(a."metadata" -> 'person' -> 'roles') WITH ORDINALITY AS r(value, ord)
    LEFT JOIN role_labels rl ON rl.code = r.value
  )
)
WHERE jsonb_typeof(a."metadata" -> 'person' -> 'roles') = 'array'
  AND jsonb_array_length(a."metadata" -> 'person' -> 'roles') > 0;

-- 2. "Nghề nghiệp / chức vụ" gộp vào "Danh hiệu" (đưa lên đầu nếu chưa có).
UPDATE "articles"
SET "metadata" = jsonb_set(
  "metadata",
  '{person,titles}',
  CASE
    WHEN COALESCE("metadata" -> 'person' -> 'titles', '[]'::jsonb) ? btrim("metadata" -> 'person' ->> 'occupation')
      THEN COALESCE("metadata" -> 'person' -> 'titles', '[]'::jsonb)
    ELSE jsonb_build_array(btrim("metadata" -> 'person' ->> 'occupation'))
      || COALESCE("metadata" -> 'person' -> 'titles', '[]'::jsonb)
  END
)
WHERE jsonb_typeof("metadata" -> 'person' -> 'occupation') = 'string'
  AND btrim("metadata" -> 'person' ->> 'occupation') <> '';

-- 3. Gỡ các trường đã bỏ: niên đại phụ, toạ độ, giờ mở cửa, toàn bộ hồ sơ sự kiện.
UPDATE "articles"
SET "metadata" = (
  "metadata"
  #- '{person,occupation}'::text[]
  #- '{person,birthDateLabel}'::text[]
  #- '{person,deathDateLabel}'::text[]
  #- '{site,latitude}'::text[]
  #- '{site,longitude}'::text[]
  #- '{site,openingHours}'::text[]
) - 'event'::text
WHERE "metadata" IS NOT NULL;

-- 4. Julius Caesar bị cào mất dấu TCN (100 – 100); trước đây chỉ nhãn ngày sinh/mất vừa gỡ ở bước 3 che lỗi này.
UPDATE "articles"
SET "start_year" = -100, "end_year" = -44, "date_text" = '100 TCN – 44 TCN'
WHERE "slug" = 'julius-caesar' AND "start_year" = 100 AND "end_year" = 100;

-- 5. Nhánh / metadata rỗng sau khi gỡ → bỏ hẳn (cùng quy ước "không lưu {}" của normalizeArticleMetadata).
UPDATE "articles" SET "metadata" = "metadata" - 'person' WHERE "metadata" -> 'person' = '{}'::jsonb;
UPDATE "articles" SET "metadata" = "metadata" - 'site' WHERE "metadata" -> 'site' = '{}'::jsonb;
UPDATE "articles" SET "metadata" = NULL WHERE "metadata" = '{}'::jsonb;
