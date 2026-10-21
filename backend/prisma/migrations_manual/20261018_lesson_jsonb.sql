DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LessonStatus') THEN
    CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
  END IF;
END$$;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE lessons 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(id::text FROM 1 FOR 8) 
WHERE slug IS NULL;

UPDATE lessons 
SET slug = 'bai-hoc-' || SUBSTRING(id::text FROM 1 FOR 8) 
WHERE slug IS NULL OR slug = '' OR slug LIKE '-%';

ALTER TABLE lessons ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "lessons_slug_key" ON lessons(slug);

UPDATE lessons SET description = summary WHERE description IS NULL AND summary IS NOT NULL;

ALTER TABLE lessons ALTER COLUMN content TYPE jsonb USING CASE 
  WHEN content IS NULL OR content = '' THEN '[]'::jsonb 
  WHEN content LIKE '[%' OR content LIKE '{%' THEN content::jsonb 
  ELSE jsonb_build_array(jsonb_build_object('type', 'html', 'content', content)) 
END;

ALTER TABLE lessons ALTER COLUMN content SET DEFAULT '[]'::jsonb;

ALTER TABLE lessons ALTER COLUMN status DROP DEFAULT;
ALTER TABLE lessons ALTER COLUMN status TYPE "LessonStatus" USING CASE 
  WHEN status::text = 'PENDING_REVIEW' THEN 'REVIEW'::"LessonStatus"
  WHEN status::text = 'REJECTED' THEN 'DRAFT'::"LessonStatus"
  WHEN status::text IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') THEN status::text::"LessonStatus"
  ELSE 'DRAFT'::"LessonStatus"
END;
ALTER TABLE lessons ALTER COLUMN status SET DEFAULT 'DRAFT'::"LessonStatus";

ALTER TABLE lessons ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE lessons ALTER COLUMN difficulty DROP NOT NULL;
ALTER TABLE lessons ALTER COLUMN display_order DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "lessons_updated_at_idx" ON lessons(updated_at);
