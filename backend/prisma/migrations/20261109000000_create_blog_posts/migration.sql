-- Bù migration còn thiếu: bảng blog_posts trước đây được tạo ngoài migration (db push),
-- khiến 20261110000000_community_phase1 lỗi trên DB dựng lại từ lịch sử migration.
-- Dùng IF NOT EXISTS để không ảnh hưởng DB đã có sẵn bảng.

CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" TEXT,
    "cover_image_url" VARCHAR(500),
    "content_blocks" JSONB NOT NULL DEFAULT '[]',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_author_id_idx" ON "blog_posts"("author_id");
CREATE INDEX IF NOT EXISTS "blog_posts_status_idx" ON "blog_posts"("status");
CREATE INDEX IF NOT EXISTS "blog_posts_is_featured_idx" ON "blog_posts"("is_featured");
CREATE INDEX IF NOT EXISTS "blog_posts_published_at_idx" ON "blog_posts"("published_at");

DO $$ BEGIN
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "authUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
