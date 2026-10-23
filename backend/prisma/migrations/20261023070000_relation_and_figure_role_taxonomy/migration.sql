-- Loại quan hệ thực thể / sự kiện và vai trò nhân vật chuyển sang danh mục dùng chung.
-- LƯU Ý: Prisma sinh DROP COLUMN + ADD COLUMN khi đổi kiểu enum → chữ (mất dữ liệu); ở đây đổi kiểu
-- tại chỗ bằng ALTER COLUMN ... TYPE ... USING để giữ nguyên dữ liệu và các index sẵn có.

-- AlterTable: quan hệ thực thể (relation_type đã là chữ) — thêm khóa ngoại tới danh mục
ALTER TABLE "historical_entity_relations" ADD COLUMN     "relation_type_id" TEXT;

-- AlterTable: quan hệ sự kiện — enum EventRelationType → VARCHAR(50), giữ dữ liệu
ALTER TABLE "historical_event_relations" ALTER COLUMN "relation_type" DROP DEFAULT;
ALTER TABLE "historical_event_relations" ALTER COLUMN "relation_type" TYPE VARCHAR(50) USING "relation_type"::TEXT;
ALTER TABLE "historical_event_relations" ALTER COLUMN "relation_type" SET DEFAULT 'CAUSES';
ALTER TABLE "historical_event_relations" ADD COLUMN     "relation_type_id" TEXT;

-- AlterTable: vai trò nhân vật — enum FigureRole[] → TEXT[], giữ dữ liệu
ALTER TABLE "persons" ALTER COLUMN "roles" DROP DEFAULT;
ALTER TABLE "persons" ALTER COLUMN "roles" TYPE TEXT[] USING "roles"::TEXT[];
ALTER TABLE "persons" ALTER COLUMN "roles" DROP NOT NULL;
ALTER TABLE "persons" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "persons" ADD COLUMN     "role_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "historical_entity_relations_relation_type_id_idx" ON "historical_entity_relations"("relation_type_id");

-- CreateIndex
CREATE INDEX "historical_event_relations_relation_type_id_idx" ON "historical_event_relations"("relation_type_id");

-- CreateIndex
CREATE INDEX "persons_role_ids_idx" ON "persons" USING GIN ("role_ids");

-- AddForeignKey
ALTER TABLE "historical_entity_relations" ADD CONSTRAINT "historical_entity_relations_relation_type_id_fkey" FOREIGN KEY ("relation_type_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_event_relations" ADD CONSTRAINT "historical_event_relations_relation_type_id_fkey" FOREIGN KEY ("relation_type_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ================================
-- Danh mục: ENTITY_RELATION, EVENT_RELATION (có nhãn chiều ngược), FIGURE_ROLE (nhiều giá trị)
-- ================================
-- inverse_label: cách đọc quan hệ từ phía đích (A "cha mẹ của" B ⇔ B "con của" A).
-- meta.symmetric = true: quan hệ hai chiều như nhau (đồng minh, cùng thời...).
INSERT INTO "taxonomy_groups" ("code", "label", "description", "multi_valued", "hierarchical", "display_order") VALUES
  ('ENTITY_RELATION', 'Quan hệ giữa thực thể', 'Quan hệ giữa nhân vật, triều đại, tổ chức, địa danh. Nhãn chiều ngược dùng khi xem từ phía thực thể đích.', false, false, 0),
  ('EVENT_RELATION', 'Quan hệ giữa sự kiện', 'Quan hệ nhân quả / thời gian giữa các sự kiện. Nhãn chiều ngược dùng khi xem từ phía sự kiện đích.', false, false, 0),
  ('FIGURE_ROLE', 'Vai trò nhân vật', 'Vai trò lịch sử của nhân vật (một nhân vật có thể có nhiều vai trò) — dùng cho bộ lọc Nhân vật.', true, false, 0);

INSERT INTO "taxonomy_terms" ("id", "group_code", "code", "label", "inverse_label", "display_order", "aliases", "meta", "updated_at") VALUES
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'LEADER_OF', 'Lãnh đạo / Chỉ huy', 'Dưới quyền lãnh đạo của', 1, ARRAY['lãnh đạo', 'chỉ huy'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'MEMBER_OF', 'Thành viên / Trực thuộc', 'Có thành viên', 2, ARRAY['thành viên', 'trực thuộc'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'FOUNDER_OF', 'Sáng lập / Khởi lập', 'Được sáng lập bởi', 3, ARRAY['sáng lập', 'khởi lập'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'SUCCESSOR_TO', 'Kế vị / Tiếp nối', 'Được kế vị bởi', 4, ARRAY['kế vị', 'tiếp nối'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'SERVED_UNDER', 'Phụng sự / Bề tôi của', 'Có bề tôi', 5, ARRAY['phụng sự', 'bề tôi'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'CONTEMPORARY_OF', 'Cùng thời với', 'Cùng thời với', 6, ARRAY['cùng thời'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'CHILD_OF', 'Con của', 'Cha mẹ của', 7, ARRAY['con cái', 'con của'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'PARENT_OF', 'Cha mẹ của', 'Con của', 8, ARRAY['cha mẹ', 'cha', 'mẹ'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'SPOUSE_OF', 'Vợ / chồng của', 'Vợ / chồng của', 9, ARRAY['phối ngẫu', 'vợ chồng'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'SIBLING_OF', 'Anh chị em ruột', 'Anh chị em ruột', 10, ARRAY['anh chị em'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'ALLIED_WITH', 'Liên minh / Đồng minh', 'Liên minh / Đồng minh', 11, ARRAY['liên minh', 'đồng minh'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'OPPOSED_TO', 'Đối địch / Kình địch', 'Đối địch / Kình địch', 12, ARRAY['đối địch', 'kình địch'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'VASSAL_OF', 'Thần phục / Chư hầu của', 'Có chư hầu', 13, ARRAY['thần phục', 'chư hầu'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'AUTHOR_OF', 'Tác giả / Khởi xướng', 'Do … sáng tác / khởi xướng', 14, ARRAY['tác giả', 'khởi xướng'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'HOUSED_AT', 'Lưu giữ / Trưng bày tại', 'Nơi lưu giữ / trưng bày', 15, ARRAY['lưu giữ', 'trưng bày'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'COMMEMORATES', 'Tưởng niệm / Vinh danh', 'Được tưởng niệm tại', 16, ARRAY['tưởng niệm', 'vinh danh'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'LOCATED_IN', 'Đặt tại / Thuộc địa phận', 'Bao gồm', 17, ARRAY['đặt tại', 'thuộc địa phận'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'CAPITAL_OF', 'Kinh đô / Thủ phủ của', 'Có kinh đô / thủ phủ', 18, ARRAY['kinh đô', 'thủ phủ'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTITY_RELATION', 'OTHER', 'Quan hệ khác', 'Quan hệ khác', 99, ARRAY['khác'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'EVENT_RELATION', 'CAUSES', 'Là nguyên nhân của', 'Bắt nguồn trực tiếp từ', 1, ARRAY['nguyên nhân', 'gây ra'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_RELATION', 'PRECEDES', 'Là tiền đề / diễn ra trước', 'Diễn ra sau', 2, ARRAY['tiền đề', 'diễn ra trước'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_RELATION', 'FOLLOWS', 'Tiếp nối / Là hệ quả của', 'Dẫn tới', 3, ARRAY['tiếp nối', 'hệ quả'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_RELATION', 'INFLUENCES', 'Tác động / Ảnh hưởng tới', 'Chịu ảnh hưởng của', 4, ARRAY['tác động', 'ảnh hưởng'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_RELATION', 'PARALLEL_TO', 'Diễn ra song song với', 'Diễn ra song song với', 5, ARRAY['đồng thời', 'song song'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_RELATION', 'OPPOSES', 'Đối kháng / Phản ứng lại', 'Bị phản ứng bởi', 6, ARRAY['đối kháng', 'phản ứng'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_RELATION', 'DERIVED_FROM', 'Bắt nguồn từ', 'Là nguồn gốc của', 7, ARRAY['bắt nguồn'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'EVENT_RELATION', 'OTHER', 'Mối liên hệ khác', 'Mối liên hệ khác', 99, ARRAY['khác'], '{"symmetric": true}'::jsonb, CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'FIGURE_ROLE', 'MONARCH', 'Vua / Hoàng đế', NULL, 1, ARRAY['vua', 'hoàng đế', 'quân chủ', 'nữ vương'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FIGURE_ROLE', 'GENERAL', 'Danh tướng', NULL, 2, ARRAY['tướng lĩnh', 'danh tướng'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FIGURE_ROLE', 'SCHOLAR', 'Danh nhân văn hóa', NULL, 3, ARRAY['danh nhân', 'thiền sư', 'học giả'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FIGURE_ROLE', 'REVOLUTIONARY', 'Nhà cách mạng / Lãnh tụ khởi nghĩa', NULL, 4, ARRAY['nhà cách mạng', 'lãnh tụ khởi nghĩa'], NULL, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FIGURE_ROLE', 'POLITICIAN', 'Chính trị gia / Quan lại', NULL, 5, ARRAY['chính trị gia', 'quan lại', 'thừa tướng'], NULL, CURRENT_TIMESTAMP);

-- Backfill
UPDATE "historical_entity_relations" r SET "relation_type_id" = t."id"
FROM "taxonomy_terms" t WHERE t."group_code" = 'ENTITY_RELATION' AND t."code" = upper(trim(r."relation_type"));

UPDATE "historical_event_relations" r SET "relation_type_id" = t."id"
FROM "taxonomy_terms" t WHERE t."group_code" = 'EVENT_RELATION' AND t."code" = upper(trim(r."relation_type"));

UPDATE "persons" p SET "role_ids" = ARRAY(
  SELECT t."id" FROM unnest(p."roles") WITH ORDINALITY AS r(code, ord)
  JOIN "taxonomy_terms" t ON t."group_code" = 'FIGURE_ROLE' AND t."code" = r.code
  ORDER BY r.ord);

-- Trigger: mọi cách ghi chỉ đặt mã → gắn id theo mã hoặc alias trong nhóm tương ứng.
CREATE OR REPLACE FUNCTION "taxonomy_term_id"(group_code TEXT, raw TEXT) RETURNS TEXT AS $$
  SELECT t."id" FROM "taxonomy_terms" t
  WHERE t."group_code" = $1 AND (t."code" = upper(trim($2)) OR lower(trim($2)) = ANY (t."aliases"))
  ORDER BY (t."code" = upper(trim($2))) DESC, t."display_order"
  LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION "fill_entity_relation_type_id"() RETURNS trigger AS $$
BEGIN
  NEW."relation_type_id" := "taxonomy_term_id"('ENTITY_RELATION', NEW."relation_type");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "historical_entity_relations_fill_type_id"
BEFORE INSERT OR UPDATE OF "relation_type" ON "historical_entity_relations"
FOR EACH ROW EXECUTE FUNCTION "fill_entity_relation_type_id"();

CREATE OR REPLACE FUNCTION "fill_event_relation_type_id"() RETURNS trigger AS $$
BEGIN
  NEW."relation_type_id" := "taxonomy_term_id"('EVENT_RELATION', NEW."relation_type");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "historical_event_relations_fill_type_id"
BEFORE INSERT OR UPDATE OF "relation_type" ON "historical_event_relations"
FOR EACH ROW EXECUTE FUNCTION "fill_event_relation_type_id"();

CREATE OR REPLACE FUNCTION "fill_person_role_ids"() RETURNS trigger AS $$
BEGIN
  NEW."role_ids" := ARRAY(
    SELECT id FROM (
      SELECT "taxonomy_term_id"('FIGURE_ROLE', r.code) AS id, r.ord
      FROM unnest(COALESCE(NEW."roles", ARRAY[]::TEXT[])) WITH ORDINALITY AS r(code, ord)
    ) x WHERE id IS NOT NULL ORDER BY ord);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "persons_fill_role_ids"
BEFORE INSERT OR UPDATE OF "roles" ON "persons"
FOR EACH ROW EXECUTE FUNCTION "fill_person_role_ids"();
