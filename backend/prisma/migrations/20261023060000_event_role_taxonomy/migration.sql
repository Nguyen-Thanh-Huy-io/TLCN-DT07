-- AlterTable
ALTER TABLE "historical_event_entities" ADD COLUMN     "role_id" TEXT;

-- CreateIndex
CREATE INDEX "historical_event_entities_role_id_idx" ON "historical_event_entities"("role_id");

-- AddForeignKey
ALTER TABLE "historical_event_entities" ADD CONSTRAINT "historical_event_entities_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ================================
-- Nhóm EVENT_ROLE: vai trò của thực thể trong sự kiện
-- ================================
-- Cột role (mã) vẫn là cách ghi của API, ingestion, seed; role_id do trigger gắn theo mã / alias.
-- role_label vẫn là mô tả tự do riêng từng sự kiện ("Chủ tướng nghĩa quân"...).
-- meta.entityTypes: loại thực thể gợi ý cho vai trò (CMS lọc danh sách chọn), không bắt buộc.
INSERT INTO "taxonomy_groups" ("code", "label", "description", "multi_valued", "hierarchical", "display_order") VALUES
  ('EVENT_ROLE', 'Vai trò trong sự kiện', 'Vai trò của nhân vật, địa điểm, lực lượng, hiện vật trong một sự kiện. Mô tả cụ thể từng sự kiện vẫn nhập tự do ở ô "Mô tả vai trò".', false, false, 0);

INSERT INTO "taxonomy_terms" ("id", "group_code", "code", "label", "icon", "display_order", "aliases", "meta", "updated_at") VALUES
  (gen_random_uuid()::text, 'EVENT_ROLE', 'LEADER', 'Lãnh đạo', 'crown', 1, ARRAY['lãnh đạo', 'lãnh tụ', 'thủ lĩnh'], '{"entityTypes":["PERSON","ORGANIZATION"]}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_ROLE', 'COMMANDER', 'Chỉ huy', 'swords', 2, ARRAY['chỉ huy', 'tư lệnh', 'chủ tướng'], '{"entityTypes":["PERSON"]}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_ROLE', 'INITIATOR', 'Khởi xướng', 'sparkles', 3, ARRAY['khởi xướng', 'phát động'], '{"entityTypes":["PERSON","ORGANIZATION","DYNASTY"]}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_ROLE', 'BELLIGERENT', 'Bên tham chiến', 'shield', 4, ARRAY['bên tham chiến', 'phe tham chiến'], '{"entityTypes":["DYNASTY","MILITARY_FORCE","ORGANIZATION","PERSON"]}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_ROLE', 'SIGNATORY', 'Đại diện ký kết', 'scroll', 5, ARRAY['đại diện ký kết', 'bên ký kết'], '{"entityTypes":["PERSON","ORGANIZATION","DYNASTY"]}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_ROLE', 'PARTICIPANT', 'Tham gia', 'users', 6, ARRAY['tham gia', 'thành viên'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_ROLE', 'LOCATION', 'Địa điểm diễn ra', 'map-pin', 7, ARRAY['địa điểm', 'nơi diễn ra'], '{"entityTypes":["LOCATION"]}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_ROLE', 'ARTIFACT_USED', 'Hiện vật liên quan', 'gem', 8, ARRAY['hiện vật', 'hiện vật liên quan'], '{"entityTypes":["ARTIFACT"]}'::jsonb, CURRENT_TIMESTAMP);

UPDATE "historical_event_entities" ee SET "role_id" = t."id"
FROM "taxonomy_terms" t
WHERE t."group_code" = 'EVENT_ROLE' AND t."code" = upper(trim(ee."role"));

-- Mọi cách ghi (API, ingestion, seed) chỉ đặt mã role → gắn role_id theo mã hoặc alias.
CREATE OR REPLACE FUNCTION "fill_event_entity_role_id"() RETURNS trigger AS $$
BEGIN
  SELECT t."id" INTO NEW."role_id"
  FROM "taxonomy_terms" t
  WHERE t."group_code" = 'EVENT_ROLE'
    AND (t."code" = upper(trim(NEW."role")) OR lower(trim(NEW."role")) = ANY (t."aliases"))
  ORDER BY (t."code" = upper(trim(NEW."role"))) DESC, t."display_order"
  LIMIT 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "historical_event_entities_fill_role_id"
BEFORE INSERT OR UPDATE OF "role" ON "historical_event_entities"
FOR EACH ROW EXECUTE FUNCTION "fill_event_entity_role_id"();
