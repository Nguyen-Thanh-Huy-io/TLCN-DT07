-- DropTable
DROP TABLE IF EXISTS "article_links" CASCADE;

-- AlterTable
ALTER TABLE "articles" DROP COLUMN IF EXISTS "date_precision";
ALTER TABLE "categories" DROP COLUMN IF EXISTS "kind";

-- DropEnum
DROP TYPE IF EXISTS "DatePrecision";
DROP TYPE IF EXISTS "ArticleKind";
