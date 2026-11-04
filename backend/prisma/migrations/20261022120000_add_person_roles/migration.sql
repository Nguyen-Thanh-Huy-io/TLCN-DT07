-- CreateEnum
CREATE TYPE "FigureRole" AS ENUM ('MONARCH', 'GENERAL', 'SCHOLAR', 'REVOLUTIONARY', 'POLITICIAN');

-- AlterTable
ALTER TABLE "persons" ADD COLUMN "roles" "FigureRole"[] NOT NULL DEFAULT ARRAY[]::"FigureRole"[];
