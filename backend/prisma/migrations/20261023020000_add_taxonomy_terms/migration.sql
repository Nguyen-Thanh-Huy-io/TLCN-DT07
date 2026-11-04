-- Danh mục dùng chung (taxonomy): bảng, dữ liệu ban đầu cho loại di tích / hiện trạng / xếp hạng,
-- và chuyển dữ liệu chữ tự do cũ của historical_sites sang khóa ngoại. Không xóa cột nào.

-- AlterTable
ALTER TABLE "historical_sites" ADD COLUMN     "preservation_id" TEXT,
ADD COLUMN     "rank_id" TEXT,
ADD COLUMN     "site_type_id" TEXT,
ADD COLUMN     "status_note" TEXT;

-- CreateTable
CREATE TABLE "taxonomy_groups" (
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "multi_valued" BOOLEAN NOT NULL DEFAULT false,
    "hierarchical" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "taxonomy_groups_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "taxonomy_terms" (
    "id" TEXT NOT NULL,
    "group_code" VARCHAR(50) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "inverse_label" VARCHAR(150),
    "description" TEXT,
    "icon" VARCHAR(50),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parent_id" TEXT,
    "meta" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxonomy_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "taxonomy_terms_group_code_is_active_idx" ON "taxonomy_terms"("group_code", "is_active");

-- CreateIndex
CREATE INDEX "taxonomy_terms_parent_id_idx" ON "taxonomy_terms"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_terms_group_code_code_key" ON "taxonomy_terms"("group_code", "code");

-- CreateIndex
CREATE INDEX "historical_sites_site_type_id_idx" ON "historical_sites"("site_type_id");

-- CreateIndex
CREATE INDEX "historical_sites_preservation_id_idx" ON "historical_sites"("preservation_id");

-- CreateIndex
CREATE INDEX "historical_sites_rank_id_idx" ON "historical_sites"("rank_id");

-- AddForeignKey
ALTER TABLE "historical_sites" ADD CONSTRAINT "historical_sites_site_type_id_fkey" FOREIGN KEY ("site_type_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_sites" ADD CONSTRAINT "historical_sites_preservation_id_fkey" FOREIGN KEY ("preservation_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_sites" ADD CONSTRAINT "historical_sites_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_group_code_fkey" FOREIGN KEY ("group_code") REFERENCES "taxonomy_groups"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================================================================
-- Dữ liệu danh mục ban đầu (reference data)
-- =========================================================================
INSERT INTO "taxonomy_groups" ("code", "label", "description", "multi_valued", "hierarchical", "display_order") VALUES
  ('SITE_TYPE', 'Loại di tích', 'Phân loại di tích / địa danh lịch sử', false, false, 1),
  ('PRESERVATION', 'Hiện trạng di tích', 'Hiện trạng chuẩn hóa — bộ lọc cố định', false, false, 2),
  ('HERITAGE_RANK', 'Cấp độ xếp hạng', 'Cấp công nhận di tích / di sản', false, false, 3);

INSERT INTO "taxonomy_terms" ("id", "group_code", "code", "label", "icon", "display_order", "aliases", "updated_at") VALUES
  (gen_random_uuid()::text, 'SITE_TYPE', 'ANCIENT_CAPITAL', 'Cố đô / Kinh thành', 'crown', 1, ARRAY['kinh đô cổ', 'cố đô', 'kinh thành'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'CITADEL', 'Thành lũy', 'castle', 2, ARRAY['thành cổ', 'thành lũy / trị sở lịch sử', 'thành lũy'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'PALACE', 'Cung điện / Dinh thự', 'landmark', 3, ARRAY['cung điện', 'dinh thự'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'BATTLEFIELD', 'Chiến trường', 'swords', 4, ARRAY['chiến trường', 'trận địa'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'RESISTANCE_BASE', 'Căn cứ kháng chiến', 'tent', 5, ARRAY['căn cứ kháng chiến', 'căn cứ địa'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'TEMPLE', 'Đền / Chùa', 'mountain', 6, ARRAY['đền thờ lịch sử', 'chùa cổ', 'đền', 'chùa'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'ARCHAEOLOGICAL_SITE', 'Di chỉ khảo cổ', 'pickaxe', 7, ARRAY['di chỉ khảo cổ'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'MONUMENT', 'Di tích / Địa danh lịch sử', 'shield', 8, ARRAY['địa vực lịch sử', 'địa danh lịch sử', 'khu di tích lịch sử'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SITE_TYPE', 'OTHER', 'Khác', 'map-pin', 99, ARRAY[]::TEXT[], CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'PRESERVATION', 'INTACT', 'Bảo tồn nguyên vẹn', '🏛️', 1, ARRAY['bảo tồn nguyên vẹn', 'bảo tồn đặc biệt'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PRESERVATION', 'MUSEUM_MEMORIAL', 'Bảo tàng & Khu tưởng niệm', '🕯️', 2, ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PRESERVATION', 'ARCHAEOLOGICAL_RUIN', 'Phế tích & Khảo cổ', '🏺', 3, ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PRESERVATION', 'RESTORED', 'Đã trùng tu / Phục dựng', '🛠️', 4, ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PRESERVATION', 'ACTIVE_SITE', 'Công trình đang hoạt động', '🚀', 5, ARRAY[]::TEXT[], CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'HERITAGE_RANK', 'UNESCO', 'Di sản Thế giới UNESCO', 'award', 1, ARRAY['unesco', 'di sản thế giới'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'HERITAGE_RANK', 'SPECIAL_NATIONAL', 'Cấp quốc gia đặc biệt', 'award', 2, ARRAY['di tích quốc gia đặc biệt'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'HERITAGE_RANK', 'NATIONAL', 'Cấp quốc gia', 'award', 3, ARRAY['di tích quốc gia', 'di tích cấp quốc gia'], CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'HERITAGE_RANK', 'PROVINCIAL', 'Cấp địa phương', 'award', 4, ARRAY['di tích cấp tỉnh', 'di tích cấp thành phố'], CURRENT_TIMESTAMP);

-- =========================================================================
-- Chuyển dữ liệu cũ (cột chữ) sang khóa ngoại danh mục. Cột chữ giữ nguyên.
-- Quy tắc giống preservation-status.constant / site-type.constant (có test).
-- =========================================================================

-- Loại di tích: khớp mã chuẩn hoặc alias.
UPDATE "historical_sites" s
SET "site_type_id" = t."id"
FROM "taxonomy_terms" t
WHERE t."group_code" = 'SITE_TYPE'
  AND (t."code" = s."site_type" OR lower(trim(s."site_type")) = ANY (t."aliases"));

-- Xếp hạng: theo từ khóa trong chữ tự do.
UPDATE "historical_sites" s
SET "rank_id" = t."id"
FROM "taxonomy_terms" t
WHERE t."group_code" = 'HERITAGE_RANK'
  AND s."recognition_level" IS NOT NULL
  AND t."code" = CASE
    WHEN lower(s."recognition_level") ~ '(unesco|thế giới)' THEN 'UNESCO'
    WHEN lower(s."recognition_level") ~ 'đặc biệt' THEN 'SPECIAL_NATIONAL'
    WHEN lower(s."recognition_level") ~ 'quốc gia' THEN 'NATIONAL'
    WHEN lower(s."recognition_level") ~ '(tỉnh|thành phố)' THEN 'PROVINCIAL'
  END;

-- Hiện trạng: nhóm theo thứ tự ưu tiên, phần chữ dư thành status_note.
WITH classified AS (
  SELECT "entity_id", "preservation_status" AS raw, lower(trim("preservation_status")) AS t,
    CASE
      WHEN lower("preservation_status") ~ '(đang hoạt động|đang sử dụng|đang vận hành)' THEN 'ACTIVE_SITE'
      WHEN lower("preservation_status") ~ '(khảo cổ|phế tích|di chỉ|tàn tích)' THEN 'ARCHAEOLOGICAL_RUIN'
      WHEN lower("preservation_status") ~ '(trùng tu|phục dựng|dựng lại|xây lại|tu bổ|phục hồi)' THEN 'RESTORED'
      WHEN lower("preservation_status") ~ '(bảo tàng|tưởng niệm|nghĩa trang)' THEN 'MUSEUM_MEMORIAL'
      WHEN lower("preservation_status") ~ '(nguyên vẹn|nguyên trạng|bảo tồn đặc biệt|bảo tồn tốt)' THEN 'INTACT'
    END AS code
  FROM "historical_sites"
  WHERE "preservation_status" IS NOT NULL AND trim("preservation_status") <> ''
)
UPDATE "historical_sites" s
SET "preservation_id" = term."id",
    "status_note" = CASE
      WHEN c.code IS NULL THEN c.raw
      WHEN c.t = lower(term."label") THEN NULL
      WHEN c.code = 'INTACT' AND c.t ~ 'đặc biệt' THEN 'Chế độ bảo tồn đặc biệt'
      WHEN c.code = 'MUSEUM_MEMORIAL' AND c.t LIKE 'bảo tồn nguyên vẹn%' THEN 'Bảo tồn nguyên vẹn'
      WHEN c.code = 'MUSEUM_MEMORIAL' THEN NULL
      ELSE c.raw
    END
FROM classified c
LEFT JOIN "taxonomy_terms" term ON term."group_code" = 'PRESERVATION' AND term."code" = c.code
WHERE s."entity_id" = c."entity_id";
