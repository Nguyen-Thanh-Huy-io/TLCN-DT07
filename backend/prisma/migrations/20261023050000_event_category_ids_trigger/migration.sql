-- Ghi sự kiện không qua API (ingestion, seed) chỉ đặt cột enum category: tự gắn loại tương ứng
-- trong danh mục EVENT_CATEGORY để category_ids luôn đầy đủ và bộ lọc theo loại không sót sự kiện.
--   * INSERT không có category_ids → [loại cùng mã / alias với category].
--   * UPDATE đổi category mà không đụng category_ids → loại chính theo category mới.
-- API (HistoricalEventService) luôn ghi cả hai cột nên không bị trigger thay đổi.
CREATE OR REPLACE FUNCTION "fill_event_category_ids"() RETURNS trigger AS $$
DECLARE
  term_id TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND cardinality(COALESCE(NEW."category_ids", ARRAY[]::TEXT[])) > 0 THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND cardinality(COALESCE(NEW."category_ids", ARRAY[]::TEXT[])) > 0
     AND (NEW."category" IS NOT DISTINCT FROM OLD."category"
          OR NEW."category_ids" IS DISTINCT FROM OLD."category_ids") THEN
    RETURN NEW;
  END IF;

  SELECT t."id" INTO term_id
  FROM "taxonomy_terms" t
  WHERE t."group_code" = 'EVENT_CATEGORY'
    AND (t."code" = NEW."category"::TEXT OR lower(NEW."category"::TEXT) = ANY (t."aliases"))
  ORDER BY (t."code" = NEW."category"::TEXT) DESC, t."display_order"
  LIMIT 1;

  NEW."category_ids" := CASE WHEN term_id IS NULL THEN ARRAY[]::TEXT[] ELSE ARRAY[term_id] END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "historical_events_fill_category_ids"
BEFORE INSERT OR UPDATE OF "category", "category_ids" ON "historical_events"
FOR EACH ROW EXECUTE FUNCTION "fill_event_category_ids"();
