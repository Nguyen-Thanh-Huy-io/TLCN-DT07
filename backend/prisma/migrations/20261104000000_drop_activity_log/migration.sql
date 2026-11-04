-- DropForeignKey
ALTER TABLE "ActivityLogEvent" DROP CONSTRAINT "ActivityLogEvent_actionedBy_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLogEventDetail" DROP CONSTRAINT "ActivityLogEventDetail_eventId_fkey";

-- DropTable
DROP TABLE "ActivityLogEvent";

-- DropTable
DROP TABLE "ActivityLogEventDetail";

-- DropEnum
DROP TYPE "actionType";

-- DropEnum
DROP TYPE "eventType";
