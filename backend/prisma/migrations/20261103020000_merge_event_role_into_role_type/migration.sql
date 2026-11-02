-- Gộp nhóm taxonomy EVENT_ROLE vào ROLE_TYPE — cả 2 nhóm từng tồn tại song song cho cùng
-- khái niệm "vai trò trong sự kiện" (EVENT_ROLE gắn với CMS/HistoricalEventEntity cũ,
-- ROLE_TYPE theo Taxonomy Specification v1.0 dùng cho HistoricalEventParticipant mới).
-- COMMANDER/PARTICIPANT đã trùng nhau; INITIATOR/BELLIGERENT/SIGNATORY/LOCATION/ARTIFACT_USED
-- (5 mã EVENT_ROLE-only) đã được thêm vào ROLE_TYPE qua taxonomy-v1.seed.ts trước khi chạy
-- migration này. "LEADER" không cần thêm vì đã khớp alias có sẵn của ROLE_TYPE.COMMANDER.

-- An toàn trước khi xoá: nếu còn HistoricalEventParticipant nào trỏ vào term EVENT_ROLE
-- (lẽ ra không còn, đã kiểm tra = 0 trước khi viết migration này), repoint sang term
-- ROLE_TYPE cùng mã trước khi xoá nhóm cũ, tránh mất thông tin vai trò do onDelete: SetNull.
UPDATE "historical_event_participants" p
SET "role_term_id" = new_term."id"
FROM "taxonomy_terms" old_term
JOIN "taxonomy_terms" new_term
  ON new_term."group_code" = 'ROLE_TYPE' AND new_term."code" = old_term."code"
WHERE p."role_term_id" = old_term."id"
  AND old_term."group_code" = 'EVENT_ROLE';

-- Hàm trigger của EVENT_ROLE từng gắn vào bảng historical_event_entities (đã xoá ở migration
-- 20261103010000) — Postgres tự xoá trigger theo bảng nhưng hàm độc lập còn mồ côi, xoá luôn.
DROP FUNCTION IF EXISTS "fill_event_entity_role_id"();

-- Xoá term + group EVENT_ROLE (không còn gì tham chiếu tới sau bước repoint trên).
DELETE FROM "taxonomy_terms" WHERE "group_code" = 'EVENT_ROLE';
DELETE FROM "taxonomy_groups" WHERE "code" = 'EVENT_ROLE';
