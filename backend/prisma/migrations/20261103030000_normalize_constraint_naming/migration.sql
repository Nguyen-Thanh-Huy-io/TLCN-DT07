-- Dọn drift đặt tên constraint/index từ migration 20261102170000 (viết tay, không qua
-- `prisma migrate diff`, nên dùng tên constraint khác chuẩn mặc định của Prisma — vd.
-- "fk_participant_entity" thay vì "historical_event_participants_entity_id_fkey"). Từ
-- migration này, `prisma migrate diff` sẽ ra rỗng thật (không còn nhiễu rename). Thuần đổi
-- tên + chuẩn hoá kiểu cột id (VARCHAR → TEXT, khớp String của Prisma) — không đổi dữ liệu,
-- không đổi cấu trúc quan hệ. Chỉ bỏ 1 index trùng (unique constraint trên predicate_term_id
-- đã tự tạo index, index thường bên cạnh là dư).

-- DropForeignKey
ALTER TABLE "historical_event_participant_references" DROP CONSTRAINT "fk_participant_ref_participant";

-- DropForeignKey
ALTER TABLE "historical_event_participant_references" DROP CONSTRAINT "fk_participant_ref_reference";

-- DropForeignKey
ALTER TABLE "historical_event_participants" DROP CONSTRAINT "fk_participant_entity";

-- DropForeignKey
ALTER TABLE "historical_event_participants" DROP CONSTRAINT "fk_participant_event";

-- DropForeignKey
ALTER TABLE "historical_event_participants" DROP CONSTRAINT "fk_participant_role_term";

-- DropForeignKey
ALTER TABLE "historical_event_periods" DROP CONSTRAINT "fk_event_period_event";

-- DropForeignKey
ALTER TABLE "historical_event_periods" DROP CONSTRAINT "fk_event_period_period";

-- DropForeignKey
ALTER TABLE "historical_references" DROP CONSTRAINT "fk_reference_format_term";

-- DropForeignKey
ALTER TABLE "historical_references" DROP CONSTRAINT "fk_reference_nature_term";

-- DropForeignKey
ALTER TABLE "historical_statement_references" DROP CONSTRAINT "fk_stmt_ref_reference";

-- DropForeignKey
ALTER TABLE "historical_statement_references" DROP CONSTRAINT "fk_stmt_ref_statement";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "fk_statement_object_entity";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "fk_statement_object_event";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "fk_statement_predicate";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "fk_statement_subject_entity";

-- DropForeignKey
ALTER TABLE "historical_statements" DROP CONSTRAINT "fk_statement_subject_event";

-- DropForeignKey
ALTER TABLE "taxonomy_predicate_rules" DROP CONSTRAINT "fk_predicate_rule_term";

-- DropIndex
DROP INDEX "taxonomy_predicate_rules_predicate_term_id_idx";

-- AlterTable
ALTER TABLE "historical_event_participant_references" DROP CONSTRAINT "historical_event_participant_references_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "participant_id" SET DATA TYPE TEXT,
ALTER COLUMN "reference_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "historical_event_participant_references_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "historical_event_participants" DROP CONSTRAINT "historical_event_participants_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "event_id" SET DATA TYPE TEXT,
ALTER COLUMN "entity_id" SET DATA TYPE TEXT,
ALTER COLUMN "role_term_id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ADD CONSTRAINT "historical_event_participants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "historical_event_periods" DROP CONSTRAINT "historical_event_periods_pkey",
ALTER COLUMN "event_id" SET DATA TYPE TEXT,
ALTER COLUMN "period_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "historical_event_periods_pkey" PRIMARY KEY ("event_id", "period_id");

-- AlterTable
ALTER TABLE "historical_references" DROP CONSTRAINT "historical_references_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "format_term_id" SET DATA TYPE TEXT,
ALTER COLUMN "nature_term_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "historical_references_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "historical_statement_references" DROP CONSTRAINT "historical_statement_references_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "statement_id" SET DATA TYPE TEXT,
ALTER COLUMN "reference_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "historical_statement_references_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "historical_statements" DROP CONSTRAINT "historical_statements_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subject_entity_id" SET DATA TYPE TEXT,
ALTER COLUMN "subject_event_id" SET DATA TYPE TEXT,
ALTER COLUMN "predicate_id" SET DATA TYPE TEXT,
ALTER COLUMN "object_entity_id" SET DATA TYPE TEXT,
ALTER COLUMN "object_event_id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ADD CONSTRAINT "historical_statements_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "taxonomy_predicate_rules" DROP CONSTRAINT "taxonomy_predicate_rules_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "predicate_term_id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ADD CONSTRAINT "taxonomy_predicate_rules_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "historical_event_participants" ADD CONSTRAINT "historical_event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_event_participants" ADD CONSTRAINT "historical_event_participants_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_event_participants" ADD CONSTRAINT "historical_event_participants_role_term_id_fkey" FOREIGN KEY ("role_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_references" ADD CONSTRAINT "historical_references_format_term_id_fkey" FOREIGN KEY ("format_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_references" ADD CONSTRAINT "historical_references_nature_term_id_fkey" FOREIGN KEY ("nature_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_event_participant_references" ADD CONSTRAINT "historical_event_participant_references_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "historical_event_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_event_participant_references" ADD CONSTRAINT "historical_event_participant_references_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "historical_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statement_references" ADD CONSTRAINT "historical_statement_references_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "historical_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statement_references" ADD CONSTRAINT "historical_statement_references_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "historical_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statements" ADD CONSTRAINT "historical_statements_subject_entity_id_fkey" FOREIGN KEY ("subject_entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statements" ADD CONSTRAINT "historical_statements_subject_event_id_fkey" FOREIGN KEY ("subject_event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statements" ADD CONSTRAINT "historical_statements_predicate_id_fkey" FOREIGN KEY ("predicate_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statements" ADD CONSTRAINT "historical_statements_object_entity_id_fkey" FOREIGN KEY ("object_entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_statements" ADD CONSTRAINT "historical_statements_object_event_id_fkey" FOREIGN KEY ("object_event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_event_periods" ADD CONSTRAINT "historical_event_periods_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "historical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_event_periods" ADD CONSTRAINT "historical_event_periods_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_predicate_rules" ADD CONSTRAINT "taxonomy_predicate_rules_predicate_term_id_fkey" FOREIGN KEY ("predicate_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "historical_event_participant_references_unique" RENAME TO "historical_event_participant_references_participant_id_refe_key";

-- RenameIndex
ALTER INDEX "historical_event_participants_event_entity_idx" RENAME TO "historical_event_participants_event_id_entity_id_idx";

-- RenameIndex
ALTER INDEX "historical_event_participants_years_idx" RENAME TO "historical_event_participants_start_year_end_year_idx";

-- RenameIndex
ALTER INDEX "uq_stmt_ref_page" RENAME TO "historical_statement_references_statement_id_reference_id_p_key";

-- RenameIndex
ALTER INDEX "historical_statements_valid_from_to_idx" RENAME TO "historical_statements_valid_from_year_valid_to_year_idx";

