-- Đề thi chỉ lấy câu hỏi từ Ngân hàng câu hỏi (2026-11-14).
-- Trước đây `quizzes.questions` (JSONB) chứa câu nhúng thẳng song song với `quiz_questions` → phía người
-- học chỉ đọc JSON, còn phần lớn câu JSON là định dạng cũ khiến 6/7 đề nộp bài bị 400.
--
-- 1. Chuyển mọi câu trong JSON vào ngân hàng (câu cùng type + prompt thì dùng lại câu đã có), gắn vào đề
--    đúng thứ tự và gắn với bài học của đề. Bỏ dạng MAP (chỉ có vùng mô tả bằng chữ, không chấm tự động).
-- 2. Chuẩn hoá các câu định dạng cũ về đúng định dạng bộ kiểm tra nhận (sinh từ
--    `src/quiz/validators/legacy-question.normalizer.ts`; mỗi lệnh chỉ khớp đúng dòng có nội dung cũ y hệt).
-- 3. Bỏ cột `quizzes.questions`.

CREATE TEMP TABLE "_legacy_quiz_questions" AS
SELECT q."id" AS quiz_id,
       q."lesson_id" AS lesson_id,
       (e.ord - 1)::int AS display_order,
       e.value->>'type' AS type,
       e.value->>'prompt' AS prompt,
       NULLIF(e.value->>'explanation', '') AS explanation,
       e.value - 'id' - 'type' - 'prompt' - 'explanation' AS data,
       NULL::text AS question_id
  FROM "quizzes" q,
       jsonb_array_elements(q."questions") WITH ORDINALITY AS e(value, ord)
 WHERE jsonb_typeof(q."questions") = 'array'
   AND e.value->>'type' IS NOT NULL
   AND e.value->>'prompt' IS NOT NULL
   AND e.value->>'type' <> 'MAP';

UPDATE "_legacy_quiz_questions" l
   SET question_id = (
     SELECT b."id" FROM "questions" b
      WHERE b."type" = l.type AND b."prompt" = l.prompt
      ORDER BY b."created_at", b."id"
      LIMIT 1);

WITH fresh AS (
  SELECT DISTINCT ON (type, prompt) type, prompt, explanation, data
    FROM "_legacy_quiz_questions"
   WHERE question_id IS NULL
   ORDER BY type, prompt, quiz_id, display_order
), inserted AS (
  INSERT INTO "questions" ("id", "type", "prompt", "explanation", "difficulty", "points", "data", "updated_at")
  SELECT gen_random_uuid()::text, type, prompt, explanation, 'MEDIUM', 10, data, CURRENT_TIMESTAMP
    FROM fresh
  RETURNING "id", "type", "prompt"
)
UPDATE "_legacy_quiz_questions" l
   SET question_id = inserted."id"
  FROM inserted
 WHERE l.question_id IS NULL AND l.type = inserted."type" AND l.prompt = inserted."prompt";

INSERT INTO "quiz_questions" ("quiz_id", "question_id", "display_order", "points")
SELECT DISTINCT ON (quiz_id, question_id) quiz_id, question_id, display_order, 10
  FROM "_legacy_quiz_questions"
 ORDER BY quiz_id, question_id, display_order
ON CONFLICT ("quiz_id", "question_id") DO NOTHING;

INSERT INTO "_LessonToQuestion" ("A", "B")
SELECT DISTINCT lesson_id, question_id
  FROM "_legacy_quiz_questions"
 WHERE lesson_id IS NOT NULL
ON CONFLICT DO NOTHING;

DROP TABLE "_legacy_quiz_questions";

-- 2. Chuẩn hoá định dạng cũ
UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Trần Khánh Dư","isCorrect":false},{"id":"b","text":"Nguyễn Khoái","isCorrect":true},{"id":"c","text":"Phạm Ngũ Lão","isCorrect":false},{"id":"d","text":"Yết Kiêu","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MULTIPLE_CHOICE' AND "prompt" = 'Vị tướng nào trực tiếp chỉ huy đoàn thuyền chiến khiêu chiến nhử quân Nguyên vào bãi cọc Bạch Đằng?' AND "data" = '{"options":["Trần Khánh Dư","Nguyễn Khoái","Phạm Ngũ Lão","Yết Kiêu"],"correctAnswer":"Nguyễn Khoái"}'::jsonb;

UPDATE "questions" SET "type" = 'TRUE_FALSE', "data" = '{"correctAnswer":false}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'TRUE_FALSE' AND "prompt" = 'Trần Hưng Đạo đã chọn thời điểm thủy triều dâng cao nhất để phản công tổng lực dồn tàu địch vào bãi cọc.' AND "data" = '{"options":["Đúng","Sai"],"correctAnswer":"Sai"}'::jsonb;

UPDATE "questions" SET "type" = 'ORDERING', "data" = '{"items":[{"id":"i1","label":"Nguyễn Khoái khiêu chiến nhử thủy quân Ô Mã Nhi vào trận địa"},{"id":"i2","label":"Thủy triều rút kiệt làm thuyền chiến địch vướng cọc và tan vỡ"},{"id":"i3","label":"Quân mai phục của Trần Hưng Đạo hai bên bờ đồng loạt đổ ra tấn công"},{"id":"i4","label":"Bắt sống tướng giặc Ô Mã Nhi và giải phóng hoàn toàn biên cương"}],"correctOrder":["i1","i2","i3","i4"]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'ORDERING' AND "prompt" = 'Sắp xếp thứ tự diễn biến của trận Bạch Đằng năm 1288:' AND "data" = '{"items":["Nguyễn Khoái khiêu chiến nhử thủy quân Ô Mã Nhi vào trận địa","Thủy triều rút kiệt làm thuyền chiến địch vướng cọc và tan vỡ","Quân mai phục của Trần Hưng Đạo hai bên bờ đồng loạt đổ ra tấn công","Bắt sống tướng giặc Ô Mã Nhi và giải phóng hoàn toàn biên cương"],"correctOrder":[0,1,2,3]}'::jsonb;

UPDATE "questions" SET "type" = 'MATCHING', "data" = '{"leftItems":[{"id":"l1","label":"Trần Hưng Đạo"},{"id":"l2","label":"Trần Khánh Dư"},{"id":"l3","label":"Ô Mã Nhi"}],"rightItems":[{"id":"r1","label":"Tổng chỉ huy trận Bạch Đằng"},{"id":"r2","label":"Đánh chìm đoàn thuyền lương Vân Đồn"},{"id":"r3","label":"Tướng giặc bị bắt sống trên sông"}],"correctPairs":[{"leftId":"l1","rightId":"r1"},{"leftId":"l2","rightId":"r2"},{"leftId":"l3","rightId":"r3"}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MATCHING' AND "prompt" = 'Nối các nhân vật lịch sử với chiến công tiêu biểu trong kháng chiến chống Nguyên Mông 1288:' AND "data" = '{"leftItems":["Trần Hưng Đạo","Trần Khánh Dư","Ô Mã Nhi"],"rightItems":["Tổng chỉ huy trận Bạch Đằng","Đánh chìm đoàn thuyền lương Vân Đồn","Tướng giặc bị bắt sống trên sông"],"correctPairs":[{"left":0,"right":0},{"left":1,"right":1},{"left":2,"right":2}]}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"1009","isCorrect":false},{"id":"b","text":"1225","isCorrect":true},{"id":"c","text":"1258","isCorrect":false},{"id":"d","text":"1400","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MULTIPLE_CHOICE' AND "prompt" = 'Triều đại nhà Trần được thành lập vào năm nào?' AND "data" = '{"options":[{"id":"a","text":"1009"},{"id":"b","text":"1225"},{"id":"c","text":"1258"},{"id":"d","text":"1400"}],"correctAnswer":"b"}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"1258, 1285, 1287-1288","isCorrect":true},{"id":"b","text":"1225, 1258, 1288","isCorrect":false},{"id":"c","text":"1280, 1285, 1290","isCorrect":false},{"id":"d","text":"1258, 1270, 1400","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MULTIPLE_CHOICE' AND "prompt" = 'Ba lần kháng chiến chống Nguyên Mông diễn ra vào những giai đoạn nào?' AND "data" = '{"options":[{"id":"a","text":"1258, 1285, 1287-1288"},{"id":"b","text":"1225, 1258, 1288"},{"id":"c","text":"1280, 1285, 1290"},{"id":"d","text":"1258, 1270, 1400"}],"correctAnswer":"a"}'::jsonb;

UPDATE "questions" SET "type" = 'ORDERING', "data" = '{"items":[{"id":"a","label":"Kháng chiến lần thứ nhất"},{"id":"b","label":"Kháng chiến lần thứ hai"},{"id":"c","label":"Kháng chiến lần thứ ba"}],"correctOrder":["a","b","c"]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'ORDERING' AND "prompt" = 'Sắp xếp các cuộc kháng chiến theo thứ tự thời gian.' AND "data" = '{"items":[{"id":"a","text":"Kháng chiến lần thứ nhất"},{"id":"b","text":"Kháng chiến lần thứ hai"},{"id":"c","text":"Kháng chiến lần thứ ba"}],"correctOrder":["a","b","c"]}'::jsonb;

UPDATE "questions" SET "type" = 'MATCHING', "data" = '{"leftItems":[{"id":"a","label":"Kháng chiến lần thứ nhất"},{"id":"b","label":"Kháng chiến lần thứ hai"},{"id":"c","label":"Chiến thắng Bạch Đằng"}],"rightItems":[{"id":"x","label":"1258"},{"id":"y","label":"1285"},{"id":"z","label":"1288"}],"correctPairs":[{"leftId":"a","rightId":"x"},{"leftId":"b","rightId":"y"},{"leftId":"c","rightId":"z"}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MATCHING' AND "prompt" = 'Nối sự kiện với niên đại tương ứng.' AND "data" = '{"leftItems":[{"id":"a","text":"Kháng chiến lần thứ nhất"},{"id":"b","text":"Kháng chiến lần thứ hai"},{"id":"c","text":"Chiến thắng Bạch Đằng"}],"rightItems":[{"id":"x","text":"1258"},{"id":"y","text":"1285"},{"id":"z","text":"1288"}],"correctPairs":[{"left":"a","right":"x"},{"left":"b","right":"y"},{"left":"c","right":"z"}]}'::jsonb;

UPDATE "questions" SET "type" = 'FILL_IN_BLANK', "data" = '{"acceptedAnswers":["Trần Quốc Tuấn","Hưng Đạo Vương"]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'FILL_IN_BLANK' AND "prompt" = 'Người chỉ huy quân đội Đại Việt trong chiến thắng Bạch Đằng năm 1288 là ______.' AND "data" = '{"correctAnswer":"Trần Hưng Đạo","acceptedAnswers":["Trần Quốc Tuấn","Hưng Đạo Vương"]}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Quy luật lên xuống của thủy triều kết hợp địa hình hiểm yếu.","isCorrect":true},{"id":"b","text":"Thời tiết sương mù dày đặc vào sáng sớm trên sông.","isCorrect":false},{"id":"c","text":"Dòng chảy xiết của mùa lũ từ thượng nguồn đổ về.","isCorrect":false},{"id":"d","text":"Địa hình đồi núi rậm rạp hai bên bờ sông.","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'SINGLE_CHOICE' AND "prompt" = 'Yếu tố tự nhiên nào đã được Ngô Quyền vận dụng tài tình nhất để phát huy tối đa uy lực của trận địa cọc trên sông Bạch Đằng?' AND "data" = '{"options":["Quy luật lên xuống của thủy triều kết hợp địa hình hiểm yếu.","Thời tiết sương mù dày đặc vào sáng sớm trên sông.","Dòng chảy xiết của mùa lũ từ thượng nguồn đổ về.","Địa hình đồi núi rậm rạp hai bên bờ sông."],"correctAnswer":"Quy luật lên xuống của thủy triều kết hợp địa hình hiểm yếu."}'::jsonb;

UPDATE "questions" SET "type" = 'MULTIPLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Chấm dứt hoàn toàn hơn một nghìn năm Bắc thuộc và đô hộ của phong kiến phương Bắc.","isCorrect":true},{"id":"b","text":"Mở ra kỷ nguyên độc lập tự chủ lâu dài và vị thế tự cường cho dân tộc ta.","isCorrect":true},{"id":"c","text":"Để lại bài học sâu sắc về nghệ thuật quân sự lấy đoản binh thắng trường trận.","isCorrect":true},{"id":"d","text":"Đánh dấu sự thành lập nhà nước Văn Lang thời Hùng Vương.","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MULTIPLE_CHOICE' AND "prompt" = 'Những nhận định nào dưới đây phản ánh chính xác ý nghĩa lịch sử to lớn của chiến thắng Bạch Đằng năm 938? (Chọn các phương án đúng)' AND "data" = '{"options":["Chấm dứt hoàn toàn hơn một nghìn năm Bắc thuộc và đô hộ của phong kiến phương Bắc.","Mở ra kỷ nguyên độc lập tự chủ lâu dài và vị thế tự cường cho dân tộc ta.","Để lại bài học sâu sắc về nghệ thuật quân sự lấy đoản binh thắng trường trận.","Đánh dấu sự thành lập nhà nước Văn Lang thời Hùng Vương."],"correctAnswers":["Chấm dứt hoàn toàn hơn một nghìn năm Bắc thuộc và đô hộ của phong kiến phương Bắc.","Mở ra kỷ nguyên độc lập tự chủ lâu dài và vị thế tự cường cho dân tộc ta.","Để lại bài học sâu sắc về nghệ thuật quân sự lấy đoản binh thắng trường trận."]}'::jsonb;

UPDATE "questions" SET "type" = 'ORDERING', "data" = '{"items":[{"id":"i1","label":"Lưu Hoằng Thao đền tội, thủy quân Nam Hán hoàn toàn tan vỡ."},{"id":"i2","label":"Kiều Công Tiễn sát hại Dương Đình Nghệ rồi cầu cứu Nam Hán."},{"id":"i3","label":"Ngô Quyền chỉ huy đóng cọc gỗ bịt sắt ngầm ở cửa sông Bạch Đằng."},{"id":"i4","label":"Ngô Quyền kéo quân ra Bắc diệt trừ phản tặc Kiều Công Tiễn."}],"correctOrder":["i2","i4","i3","i1"]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'TIMELINE' AND "prompt" = 'Sắp xếp các diễn biến sau theo đúng trình tự thời gian của cuộc kháng chiến chống quân Nam Hán năm 938:' AND "data" = '{"items":["Lưu Hoằng Thao đền tội, thủy quân Nam Hán hoàn toàn tan vỡ.","Kiều Công Tiễn sát hại Dương Đình Nghệ rồi cầu cứu Nam Hán.","Ngô Quyền chỉ huy đóng cọc gỗ bịt sắt ngầm ở cửa sông Bạch Đằng.","Ngô Quyền kéo quân ra Bắc diệt trừ phản tặc Kiều Công Tiễn."],"correctOrder":["Kiều Công Tiễn sát hại Dương Đình Nghệ rồi cầu cứu Nam Hán.","Ngô Quyền kéo quân ra Bắc diệt trừ phản tặc Kiều Công Tiễn.","Ngô Quyền chỉ huy đóng cọc gỗ bịt sắt ngầm ở cửa sông Bạch Đằng.","Lưu Hoằng Thao đền tội, thủy quân Nam Hán hoàn toàn tan vỡ."]}'::jsonb;

UPDATE "questions" SET "type" = 'MATCHING', "data" = '{"leftItems":[{"id":"l1","label":"Ngô Quyền"},{"id":"l2","label":"Lưu Hoằng Thao"},{"id":"l3","label":"Kiều Công Tiễn"},{"id":"l4","label":"Dương Đình Nghệ"}],"rightItems":[{"id":"r1","label":"Chủ soái chỉ huy chiến thắng Bạch Đằng"},{"id":"r2","label":"Chỉ huy đạo thủy binh Nam Hán xâm lược"},{"id":"r3","label":"Kẻ phản nghịch cầu cứu quân Nam Hán"},{"id":"r4","label":"Vị tướng lập nền tự chủ, cha vợ Ngô Quyền"}],"correctPairs":[{"leftId":"l1","rightId":"r1"},{"leftId":"l2","rightId":"r2"},{"leftId":"l3","rightId":"r3"},{"leftId":"l4","rightId":"r4"}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MATCHING' AND "prompt" = 'Hãy ghép nối chính xác mỗi nhân vật lịch sử với vai trò hoặc hành động tiêu biểu năm 938:' AND "data" = '{"pairs":[{"left":"Ngô Quyền","right":"Chủ soái chỉ huy chiến thắng Bạch Đằng"},{"left":"Lưu Hoằng Thao","right":"Chỉ huy đạo thủy binh Nam Hán xâm lược"},{"left":"Kiều Công Tiễn","right":"Kẻ phản nghịch cầu cứu quân Nam Hán"},{"left":"Dương Đình Nghệ","right":"Vị tướng lập nền tự chủ, cha vợ Ngô Quyền"}]}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Biết rõ điểm yếu tâm lý và thể lực của đối phương, chủ động chớp thời cơ.","isCorrect":true},{"id":"b","text":"Chỉ dựa vào ưu thế vượt trội về số lượng quân lính.","isCorrect":false},{"id":"c","text":"Thực hiện chiến lược bị động phòng thủ cố thủ bờ cõi.","isCorrect":false},{"id":"d","text":"Kéo dài thời gian đàm phán để làm địch nản lòng.","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'SOURCE_ANALYSIS' AND "prompt" = 'Đọc đoạn trích sau trong sách "Đại Việt sử ký toàn thư" và cho biết nhận xét nào đúng nhất về nghệ thuật cầm quân của Ngô Quyền:

"Ngô Quyền nghe tin Hoằng Thao sắp đến, bảo các tướng tá rằng: Hoằng Thao là đứa trẻ khờ dại, đem quân từ xa đến, quân lính mỏi mệt, lại nghe Công Tiễn đã chết, không có người làm nội ứng, đã mất vía trước rồi. Quân ta lấy sức còn khỏe địch với quân mỏi mệt, tất phá được."' AND "data" = '{"options":["Biết rõ điểm yếu tâm lý và thể lực của đối phương, chủ động chớp thời cơ.","Chỉ dựa vào ưu thế vượt trội về số lượng quân lính.","Thực hiện chiến lược bị động phòng thủ cố thủ bờ cõi.","Kéo dài thời gian đàm phán để làm địch nản lòng."],"sourceCite":"Đại Việt sử ký toàn thư — Bản kỷ, Quyển 1","sourceText":"Hoằng Thao là đứa trẻ khờ dại, đem quân từ xa đến, quân lính mỏi mệt, lại nghe Công Tiễn đã chết, không có người làm nội ứng, đã mất vía trước rồi. Quân ta lấy sức còn khỏe địch với quân mỏi mệt, tất phá được.","correctAnswer":"Biết rõ điểm yếu tâm lý và thể lực của đối phương, chủ động chớp thời cơ."}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Trận địa cọc gỗ bịt sắt cắm ngầm dưới lòng sông.","isCorrect":true},{"id":"b","text":"Hệ thống súng hỏa mai và đại bác phòng thủ bờ biển.","isCorrect":false},{"id":"c","text":"Bè mảng gắn dầu hỏa hỏa công đốt thuyền giặc.","isCorrect":false},{"id":"d","text":"Hầm chông bí mật đào dọc theo triền đê.","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'RECOGNITION' AND "prompt" = 'Hiện vật khảo cổ tiêu biểu được tìm thấy tại bãi cọc Yên Giang (Quảng Yên, Quảng Ninh) minh chứng cho chiến thuật độc đáo nào của quân dân ta?' AND "data" = '{"options":["Trận địa cọc gỗ bịt sắt cắm ngầm dưới lòng sông.","Hệ thống súng hỏa mai và đại bác phòng thủ bờ biển.","Bè mảng gắn dầu hỏa hỏa công đốt thuyền giặc.","Hầm chông bí mật đào dọc theo triền đê."],"imageUrl":"https://images.unsplash.com/photo-1598417642835-f05aa7bd7702?auto=format&fit=crop&w=1400&q=85","correctAnswer":"Trận địa cọc gỗ bịt sắt cắm ngầm dưới lòng sông."}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Đấu trường Colosseum","isCorrect":true},{"id":"b","text":"Đền Pantheon","isCorrect":false},{"id":"c","text":"Quảng trường Forum","isCorrect":false},{"id":"d","text":"Nhà hát Pompeii","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'SINGLE_CHOICE' AND "prompt" = 'Công trình kiến trúc vĩ đại nào của La Mã cổ đại từng là nơi diễn ra các cuộc giác đấu đẫm máu?' AND "data" = '{"options":["Đấu trường Colosseum","Đền Pantheon","Quảng trường Forum","Nhà hát Pompeii"],"correctAnswer":"Đấu trường Colosseum"}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Văn minh La Mã","isCorrect":true},{"id":"b","text":"Văn minh Ai Cập","isCorrect":false},{"id":"c","text":"Văn minh Lưỡng Hà","isCorrect":false},{"id":"d","text":"Văn minh Ấn Độ","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'RECOGNITION' AND "prompt" = 'Hình ảnh mái vòm và hệ thống cuốn vòm đá này là thành tựu kỹ thuật xây dựng đặc sắc của nền văn minh nào?' AND "data" = '{"options":["Văn minh La Mã","Văn minh Ai Cập","Văn minh Lưỡng Hà","Văn minh Ấn Độ"],"imageUrl":"https://images.unsplash.com/photo-1698416652584-b4648907a7ac?auto=format&fit=crop&w=1000&q=80","correctAnswer":"Văn minh La Mã"}'::jsonb;

UPDATE "questions" SET "type" = 'MULTIPLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Hệ thống Luật La Mã (La Mã Law) đặt nền móng cho pháp luật dân sự hiện đại.","isCorrect":true},{"id":"b","text":"Hệ thống chữ viết Latinh được sử dụng rộng rãi toàn cầu ngày nay.","isCorrect":true},{"id":"c","text":"Kỹ thuật xây dựng cầu dẫn nước và đường bộ quy mô lớn.","isCorrect":true},{"id":"d","text":"Phát minh ra máy hơi nước và đại bác hỏa mai.","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MULTIPLE_CHOICE' AND "prompt" = 'Đóng góp to lớn nhất của nền văn minh La Mã đối với văn minh phương Tây hiện đại là gì?' AND "data" = '{"options":["Hệ thống Luật La Mã (La Mã Law) đặt nền móng cho pháp luật dân sự hiện đại.","Hệ thống chữ viết Latinh được sử dụng rộng rãi toàn cầu ngày nay.","Kỹ thuật xây dựng cầu dẫn nước và đường bộ quy mô lớn.","Phát minh ra máy hơi nước và đại bác hỏa mai."],"correctAnswers":["Hệ thống Luật La Mã (La Mã Law) đặt nền móng cho pháp luật dân sự hiện đại.","Hệ thống chữ viết Latinh được sử dụng rộng rãi toàn cầu ngày nay.","Kỹ thuật xây dựng cầu dẫn nước và đường bộ quy mô lớn."]}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Quần chúng nhân dân tấn công phá ngục Bastille.","isCorrect":true},{"id":"b","text":"Hội nghị ba đẳng cấp khai mạc tại Versailles.","isCorrect":false},{"id":"c","text":"Vua Louis XVI bị đưa lên máy chém.","isCorrect":false},{"id":"d","text":"Tuyên ngôn Nhân quyền và Dân quyền được ban bố.","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'SINGLE_CHOICE' AND "prompt" = 'Sự kiện ngày 14/7/1789 tại Paris mở đầu cho cuộc Cách mạng Pháp là gì?' AND "data" = '{"options":["Quần chúng nhân dân tấn công phá ngục Bastille.","Hội nghị ba đẳng cấp khai mạc tại Versailles.","Vua Louis XVI bị đưa lên máy chém.","Tuyên ngôn Nhân quyền và Dân quyền được ban bố."],"correctAnswer":"Quần chúng nhân dân tấn công phá ngục Bastille."}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Tự do - Bình đẳng - Bác ái (Liberté, Égalité, Fraternité)","isCorrect":true},{"id":"b","text":"Độc lập - Tự do - Hạnh phúc","isCorrect":false},{"id":"c","text":"Vô sản toàn thế giới liên hiệp lại","isCorrect":false},{"id":"d","text":"Cơm áo - Hòa bình - Ruộng đất","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'SINGLE_CHOICE' AND "prompt" = 'Khẩu hiệu nổi tiếng toàn cầu của Cách mạng tư sản Pháp năm 1789 là gì?' AND "data" = '{"options":["Tự do - Bình đẳng - Bác ái (Liberté, Égalité, Fraternité)","Độc lập - Tự do - Hạnh phúc","Vô sản toàn thế giới liên hiệp lại","Cơm áo - Hòa bình - Ruộng đất"],"correctAnswer":"Tự do - Bình đẳng - Bác ái (Liberté, Égalité, Fraternité)"}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"09/04/1288","isCorrect":true},{"id":"b","text":"08/03/1288","isCorrect":false},{"id":"c","text":"01/01/1288","isCorrect":false},{"id":"d","text":"30/04/1288","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'SINGLE_CHOICE' AND "prompt" = 'Trận Bạch Đằng năm 1288 diễn ra vào ngày nào theo dương lịch?' AND "data" = '{"options":["09/04/1288","08/03/1288","01/01/1288","30/04/1288"],"correctAnswer":"09/04/1288"}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Trần Thái Tông","isCorrect":false},{"id":"b","text":"Trần Quốc Tuấn","isCorrect":true},{"id":"c","text":"Trần Nhân Tông","isCorrect":false},{"id":"d","text":"Lê Lợi","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MULTIPLE_CHOICE' AND "prompt" = 'Ai là tác giả của Hịch tướng sĩ?' AND "data" = '{"options":[{"id":"a","text":"Trần Thái Tông"},{"id":"b","text":"Trần Quốc Tuấn"},{"id":"c","text":"Trần Nhân Tông"},{"id":"d","text":"Lê Lợi"}],"correctAnswer":"b"}'::jsonb;

UPDATE "questions" SET "type" = 'ORDERING', "data" = '{"items":[{"id":"a","label":"Thành lập nhà Trần"},{"id":"b","label":"Kháng chiến lần thứ nhất"},{"id":"c","label":"Hội nghị Diên Hồng"},{"id":"d","label":"Chiến thắng Bạch Đằng"}],"correctOrder":["a","b","c","d"]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'ORDERING' AND "prompt" = 'Sắp xếp các sự kiện sau theo trình tự lịch sử.' AND "data" = '{"items":[{"id":"a","text":"Thành lập nhà Trần"},{"id":"b","text":"Kháng chiến lần thứ nhất"},{"id":"c","text":"Hội nghị Diên Hồng"},{"id":"d","text":"Chiến thắng Bạch Đằng"}],"correctOrder":["a","b","c","d"]}'::jsonb;

UPDATE "questions" SET "type" = 'MATCHING', "data" = '{"leftItems":[{"id":"a","label":"Trần Hưng Đạo"},{"id":"b","label":"Trần Nhân Tông"},{"id":"c","label":"Trần Cảnh"}],"rightItems":[{"id":"x","label":"Hoàng đế đầu tiên của nhà Trần"},{"id":"y","label":"Danh tướng nhà Trần"},{"id":"z","label":"Vua lãnh đạo Đại Việt trong các cuộc kháng chiến"}],"correctPairs":[{"leftId":"a","rightId":"y"},{"leftId":"b","rightId":"z"},{"leftId":"c","rightId":"x"}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MATCHING' AND "prompt" = 'Nối nhân vật với vai trò lịch sử tương ứng.' AND "data" = '{"leftItems":[{"id":"a","text":"Trần Hưng Đạo"},{"id":"b","text":"Trần Nhân Tông"},{"id":"c","text":"Trần Cảnh"}],"rightItems":[{"id":"x","text":"Hoàng đế đầu tiên của nhà Trần"},{"id":"y","text":"Danh tướng nhà Trần"},{"id":"z","text":"Vua lãnh đạo Đại Việt trong các cuộc kháng chiến"}],"correctPairs":[{"left":"a","right":"y"},{"left":"b","right":"z"},{"left":"c","right":"x"}]}'::jsonb;

UPDATE "questions" SET "type" = 'FILL_IN_BLANK', "data" = '{"acceptedAnswers":["1225"]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'FILL_IN_BLANK' AND "prompt" = 'Triều đại nhà Trần được thành lập vào năm ______.' AND "data" = '{"correctAnswer":"1225","acceptedAnswers":["1225"]}'::jsonb;

UPDATE "questions" SET "type" = 'SINGLE_CHOICE', "data" = '{"options":[{"id":"a","text":"Chỉ dựa vào ưu thế về quân số","isCorrect":false},{"id":"b","text":"Tinh thần đoàn kết và chiến lược quân sự phù hợp","isCorrect":true},{"id":"c","text":"Không cần tổ chức quân đội","isCorrect":false},{"id":"d","text":"Chỉ sử dụng chiến thuật phòng thủ cố định","isCorrect":false}]}'::jsonb, "updated_at" = CURRENT_TIMESTAMP
 WHERE "type" = 'MULTIPLE_CHOICE' AND "prompt" = 'Đâu là một trong những nguyên nhân quan trọng dẫn đến thắng lợi của quân dân Đại Việt trong ba lần kháng chiến?' AND "data" = '{"options":[{"id":"a","text":"Chỉ dựa vào ưu thế về quân số"},{"id":"b","text":"Tinh thần đoàn kết và chiến lược quân sự phù hợp"},{"id":"c","text":"Không cần tổ chức quân đội"},{"id":"d","text":"Chỉ sử dụng chiến thuật phòng thủ cố định"}],"correctAnswer":"b"}'::jsonb;

-- 3. AlterTable
ALTER TABLE "quizzes" DROP COLUMN "questions";
