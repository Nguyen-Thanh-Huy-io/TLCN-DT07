-- Vạn Kiếp được ingest với hồ sơ di tích sai định dạng (mã loại "Military Base", địa chỉ nằm ở khoá lạ
-- "modernLocation"), nên thẻ /di-tich hiện chữ tiếng Anh thô và "Chưa rõ địa phương".
UPDATE "articles"
SET "metadata" = jsonb_set(
  jsonb_set(
    "metadata" #- '{site,modernLocation}'::text[] #- '{site,historicalSignificance}'::text[],
    '{site,siteType}',
    '"RESISTANCE_BASE"'
  ),
  '{site,address}',
  '"Chí Linh, Hải Phòng"'
)
WHERE "slug" = 'van-kiep' AND "metadata" -> 'site' ->> 'siteType' = 'Military Base';
