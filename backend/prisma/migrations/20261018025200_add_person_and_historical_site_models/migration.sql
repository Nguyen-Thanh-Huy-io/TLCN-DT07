-- 1. Create table persons
CREATE TABLE IF NOT EXISTS "persons" (
    "entity_id" TEXT NOT NULL,
    "birth_year" INTEGER,
    "death_year" INTEGER,
    "birth_date_label" VARCHAR(100),
    "death_date_label" VARCHAR(100),
    "biography" TEXT,
    "occupation" VARCHAR(255),
    "titles" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "persons_pkey" PRIMARY KEY ("entity_id"),
    CONSTRAINT "persons_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Create table historical_sites
CREATE TABLE IF NOT EXISTS "historical_sites" (
    "entity_id" TEXT NOT NULL,
    "site_type" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "construction_year" INTEGER,
    "construction_label" VARCHAR(100),
    "preservation_status" VARCHAR(100),
    "recognition_level" VARCHAR(100),
    "managing_agency" VARCHAR(255),

    CONSTRAINT "historical_sites_pkey" PRIMARY KEY ("entity_id"),
    CONSTRAINT "historical_sites_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "historical_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Create Index on site_type
CREATE INDEX IF NOT EXISTS "historical_sites_site_type_idx" ON "historical_sites"("site_type");

-- 4. Migrate existing data from historical_entities into persons for PERSON entities
INSERT INTO "persons" ("entity_id", "birth_year", "death_year", "birth_date_label", "death_date_label")
SELECT "id", "birth_year", "death_year", "birth_date_label", "death_date_label"
FROM "historical_entities"
WHERE "type" = 'PERSON'
ON CONFLICT ("entity_id") DO NOTHING;

-- 5. Drop deprecated columns on historical_entities table
ALTER TABLE "historical_entities" DROP COLUMN IF EXISTS "birth_year";
ALTER TABLE "historical_entities" DROP COLUMN IF EXISTS "death_year";
ALTER TABLE "historical_entities" DROP COLUMN IF EXISTS "birth_date_label";
ALTER TABLE "historical_entities" DROP COLUMN IF EXISTS "death_date_label";
