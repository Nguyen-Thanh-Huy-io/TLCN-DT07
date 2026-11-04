-- Bổ sung Period.periodTypeId (gắn Period với danh mục PERIOD_TYPE) — Data Dictionary v1.0
-- mục 6.1 yêu cầu trường này nhưng model Period trước đây thiếu hoàn toàn. Chỉ áp dụng
-- đúng phần thay đổi của Period; các câu rename/alter khác do `prisma migrate diff` đề
-- xuất chỉ là khác biệt đặt tên constraint với migration trước (20261102170000), không
-- liên quan tới thay đổi này nên đã loại bỏ khỏi file để tránh đụng chạm ngoài phạm vi.

-- AlterTable
ALTER TABLE "periods" ADD COLUMN "period_type_id" TEXT;

-- CreateIndex
CREATE INDEX "periods_period_type_id_idx" ON "periods"("period_type_id");

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_period_type_id_fkey" FOREIGN KEY ("period_type_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
