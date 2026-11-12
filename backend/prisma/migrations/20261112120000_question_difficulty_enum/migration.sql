-- AlterTable: convert questions.difficulty from VARCHAR(20) to enum DifficultyLevel
ALTER TABLE "questions"
  ALTER COLUMN "difficulty" DROP DEFAULT,
  ALTER COLUMN "difficulty" TYPE "DifficultyLevel" USING (
    CASE
      WHEN "difficulty" IN ('EASY', 'MEDIUM', 'HARD') THEN "difficulty"::"DifficultyLevel"
      ELSE 'MEDIUM'::"DifficultyLevel"
    END
  ),
  ALTER COLUMN "difficulty" SET DEFAULT 'MEDIUM'::"DifficultyLevel";
