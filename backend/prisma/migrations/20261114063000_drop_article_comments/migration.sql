-- DropForeignKey
ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_article_id_fkey";

-- DropForeignKey
ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_parent_id_fkey";

-- DropTable
DROP TABLE "article_comments";

-- DropEnum
DROP TYPE "ArticleCommentStatus";
