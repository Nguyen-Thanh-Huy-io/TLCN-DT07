-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('POST', 'COMMENT');

-- AlterTable: đổi kiểu tại chỗ (giữ dữ liệu + index content_reports_target_type_target_id_idx)
ALTER TABLE "content_reports"
  ALTER COLUMN "target_type" TYPE "ReportTargetType" USING ("target_type"::text::"ReportTargetType");

-- AlterEnum: sửa lỗi chính tả, giữ nguyên các dòng đã có
ALTER TYPE "email_provider" RENAME VALUE 'stmp' TO 'smtp';

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_authId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_subscriptionId_fkey";
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_subscriptionId_fkey";

-- DropTable (các bảng gói thuê bao chưa từng được code dùng, dữ liệu rỗng)
DROP TABLE "Subscription";
DROP TABLE "SubscriptionPlan";
DROP TABLE "Payment";
DROP TABLE "Invoice";

-- DropEnum
DROP TYPE "subscriptionStatus";
DROP TYPE "billingInterval";
DROP TYPE "paymentStatus";
DROP TYPE "invoiceStatus";
