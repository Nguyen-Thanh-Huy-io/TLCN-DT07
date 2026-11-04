# Bản đồ frontend/src/features/lessons

Gốc: `frontend/src/features/lessons/`

## components/
- `AutoSaveIndicator.tsx` – hiển thị trạng thái tự lưu + "x phút trước"; export `AutoSaveIndicator`, `AutoSaveIndicatorProps`.
- `LessonBlockPalette.tsx` – bảng chọn block (click/kéo thả) ở sidebar trái; `LessonBlockPalette`.
- `LessonDifficultySelector.tsx` – chọn độ khó bài học; `LessonDifficultySelector`.
- `LessonEditor.tsx` – component trang soạn bài chính (lớn nhất), ghép sidebar, canvas, TipTap, metadata; `LessonEditor`, enum `LeftSidebarMode`, `SidebarTab`; dùng facade `useLessonEditorFacade`.
- `LessonHeaderMetaForm.tsx` – form metadata đầu bài (tiêu đề, chủ đề, tag, độ khó); `LessonHeaderMetaForm`.
- `LessonLeftSidebar.tsx` – sidebar trái: mục lục (TOC), quick settings, loại bài; `LessonLeftSidebar`.
- `LessonList.tsx` – danh sách bài học; `LessonList`.
- `LessonMediaManager.tsx` – quản lý album media (upload ảnh/tài liệu, thêm link URL); `LessonMediaManager`.
- `LessonOrderField.tsx` – ô nhập thứ tự bài (stepper, giới hạn [1,maxNextOrder]) + preview timeline qua `LessonTimelineStrategy`; `LessonOrderField`.
- `LessonTagPicker.tsx` – chọn/tìm tag, gợi ý Core Historical Tags, dropdown; `LessonTagPicker`.
- `LessonTopicModalPicker.tsx` – modal chọn chủ đề với breadcrumb phân cấp và tìm kiếm; `LessonTopicModalPicker`.
- `TipTapContent.tsx` – wrapper trình soạn TipTap, đồng bộ value từ server; `TipTapContent`.
- `TipTapToolbar.tsx` – toolbar TipTap (định dạng, chèn ảnh từ máy/URL, YouTube, link); `TipTapToolbar`.

### components/blocks/ (NodeView của TipTap)
- `AddBlockBelowMenu.tsx` – menu thêm block ngay bên dưới; `AddBlockBelowMenu`.
- `CharacterBlockView.tsx` – NodeView block Nhân vật (chọn từ HISGO/Wikipedia); `CharacterBlockView`.
- `EntityPickerModal.tsx` – modal chọn thực thể (tab HISGO / Wikipedia, preview, sửa trước khi chèn) qua Strategy nguồn; `EntityPickerModal`, `EntitySelectionPayload`.
- `EventBlockView.tsx` – NodeView block Sự kiện; `EventBlockView`.
- `EventPickerModal.tsx` – modal chọn sự kiện HISGO/Wikipedia+Wikidata; `EventPickerModal`, `EventSelectionPayload`.
- `HistoricalTimelineBlock.tsx` – hiển thị/sửa timeline lịch sử, thêm mốc thủ công hoặc từ HISGO; `HistoricalTimelineBlock`, `TimelineNode`, `TimelineNodeMedia`.
- `ImageBlockView.tsx` – NodeView block Ảnh (upload, URL, thư viện); `ImageBlockView`.
- `TimelineBlockView.tsx` – NodeView block Timeline (parse nodes, thêm/sửa/xoá mốc); `TimelineBlockView`.
- `VideoBlockView.tsx` – NodeView block Video (upload, URL, YouTube→embed, iframe); `VideoBlockView`.

### components/builder/ (Block Builder canvas)
- `AddBlockDivider.tsx` – đường chia có nút thêm block (popover); `AddBlockDivider`.
- `BlockBuilderCanvas.tsx` – canvas dựng block, DnD, tự chia hàng visual theo width, hỗ trợ Row nhiều cột; `BlockBuilderCanvas`.
- `BlockCardWrapper.tsx` – khung bọc block (chọn, di chuyển, xoá, đổi độ rộng); `BlockCardWrapper`.
- `CharacterBlockItemEditor.tsx` – editor inline block Nhân vật (thu gọn/mở rộng); `CharacterBlockItemEditor`.
- `ColumnResizer.tsx` – tay kéo đổi tỉ lệ cột; `ColumnResizer`.
- `EventBlockItemEditor.tsx` – editor inline block Sự kiện; `EventBlockItemEditor`.
- `RowSectionBlockEditor.tsx` – editor block Hàng nhiều cột (SECTION_ROW), preset tỉ lệ; `RowSectionBlockEditor`.
- `TextBlockEditor.tsx` – editor block Văn bản, có modal soạn tập trung + đếm từ; `TextBlockEditor`.
- `TimelineBlockItemEditor.tsx` – editor inline block Timeline (mốc thu gọn được); `TimelineBlockItemEditor`.
- `TimelineNodeCanvasDrawer.tsx` – drawer chỉnh media cho mốc timeline; `TimelineNodeCanvasDrawer`.

## constants/
- `block-node.constants.ts` – hằng cho node Image/Video/Timeline/Character/Event; enum `VideoSourceType`, `*_BLOCK_CONSTANTS`.
- `block-palette.constants.ts` – `LESSON_BLOCK_ITEMS` (nhóm nội dung cơ bản + khối chuyên biệt).
- `entity-source.constants.ts` – `ENTITY_SOURCE_CONSTANTS` (hằng nguồn thực thể, tránh magic string).
- `left-sidebar.constants.ts` – `QUICK_SETTING_ITEMS`, `LESSON_TYPE_CONFIGS`.
- `row-layout.constants.ts` – `ROW_LAYOUT_CONFIG`, `ROW_RATIO_PRESETS`, `RatioPresetItem`.

## extensions/ (TipTap Node.create)
- `character-block.extension.ts` – `CharacterBlockExtension`.
- `event-block.extension.ts` – `EventBlockExtension`.
- `image-block.extension.ts` – `ImageBlockExtension`.
- `timeline-block.extension.ts` – `TimelineBlockExtension`.
- `video-block.extension.ts` – `VideoBlockExtension`.

## facades/ (Facade Pattern)
- `useLessonBlockManager.ts` – hook quản lý danh sách block (thêm/xoá/di chuyển, Row & cột, parse JSON/HTML); `useLessonBlockManager`, `UseLessonBlockManagerReturn`.
- `useLessonEditorFacade.ts` – facade tổng cho editor: form state, topics, gợi ý thứ tự, media, auto-save draft local (debounce), metadata/status; `useLessonEditorFacade`.

## factories/ (Factory Pattern)
- `entity-source-strategy.factory.ts` – `EntitySourceStrategyFactory`, tạo strategy nguồn thực thể theo type.
- `lesson-block.factory.ts` – `LessonBlockFactory`, `generateBlockId`; tạo dữ liệu block mặc định theo loại.

## rules/
- `block-placement.rule.ts` – `BlockPlacementRuleEngine`, `PlacementContext`, `PlacementValidationResult`; luật: Row không lồng cột, Timeline cần ≥50% rộng, Quiz chỉ ở cuối cấp ngoài cùng.

## strategies/ (Strategy Pattern)
- `block-width.strategy.ts` – `BlockWidthStrategy`, `IBlockWidthOption`; tuỳ chọn độ rộng block.
- `lesson-block-insert.strategy.ts` – `IBlockInsertStrategy`, `LessonBlockInsertStrategy`, singleton `lessonBlockInsertStrategy`; chèn block vào editor.
- `lesson-timeline.strategy.ts` – `LessonTimelineStrategy`, `LESSON_ORDER_CONSTANTS`; tính vị trí/diễn giải thứ tự bài trong chủ đề.
- `row-layout.strategy.ts` – `RowLayoutStrategy`; clamp [min,max], làm tròn bước 5% tỉ lệ cột.
- `timeline-layout.strategy.ts` – `TimelineLayoutStrategy`, `ITimelineOrientationOption`; hướng timeline ngang/dọc.

### strategies/entity-sources/
- `entity-source.interface.ts` – `IEntityDataSourceStrategy` (search/detail).
- `hisgo-internal-source.strategy.ts` – `HisgoInternalSourceStrategy`, nguồn kho nội bộ HISGO.
- `wikipedia-source.strategy.ts` – `WikipediaSourceStrategy`; Wikipedia VI + làm giàu Wikidata + giấy phép Commons.
- `wikipedia.adapter.ts` – `WikipediaEntityAdapter`; chuẩn hoá dữ liệu Wikipedia, tách năm sinh/mất.
- `wikidata-claims.adapter.ts` – `WikidataClaimsAdapter`; parse claims (ngày P569/P570/P580..., toạ độ).
- `wikimedia-commons.adapter.ts` – `WikimediaCommonsAdapter`; metadata ảnh/tác giả/giấy phép.

## templates/ (Factory + Strategy)
- `lesson-template.factory.ts` – `LessonTemplateFactory`, tạo template theo loại.
- `lesson-template.types.ts` – `LessonTemplateType`, `LessonTemplateContext`, `LessonTemplateMeta`, `ILessonTemplateStrategy`.
- `strategies.ts` – `StandardLessonTemplateStrategy`, `MilitaryCampaignTemplateStrategy`, `HistoricalFigureTemplateStrategy`.

## types/
- `block-builder.types.ts` – enum `BlockWidthType`, `TimelineOrientation`; `BaseBlockData`, `TextBlockData`, `TimelineBlockData`, `CharacterBlockData`, `EventBlockData`…
- `block-palette.types.ts` – `LessonBlockType`, `LessonBlockGroup`, `BlockPaletteItem`, `LessonBlockPaletteProps`.
- `editor.types.ts` – `LessonMediaItem`, `LessonFormData`, `UseLessonEditorFacadeReturn`.
- `entity-source.types.ts` – `EntitySourceType`, `IEntitySearchResult`, `IEntityDetailPreview`, `IWikipediaSearchResponse`.
- `header-meta.types.ts` – `TopicOption`, `LessonHeaderMetaData`, `LessonHeaderMetaFormProps`.
- `left-sidebar.types.ts` – `QuickSettingKey`, `QuickSettingItem`, `TocItem`, `LessonCategoryType`, `LessonTypeConfig`, `LessonLeftSidebarProps`.

# frontend/tests/*.py (Selenium/pytest, cần app chạy ở localhost:3000)
- `capture_canvas.py` – script Selenium chụp canvas (không phải test).
- `test_block_builder_dnd.py` – canvas, chèn block từ palette/divider, đổi thứ tự bằng nút.
- `test_block_palette.py` – palette hiển thị đủ 10 block, click chọn, lịch sử click.
- `test_block_palette_img2_basic.py` – palette chia 2 nhóm, 4 block cơ bản, click chèn vào editor.
- `test_block_width_and_timeline_orientation.py` – đổi hướng timeline và ma trận độ rộng block.
- `test_bubble_menu.py` – bubble menu hiện khi chọn text, không xuống dòng.
- `test_chapter_grouping_and_lesson_order.py` – sidebar chương, modal đổi chương, thứ tự bài.
- `test_dropdown_width_and_text_modal.py` – dropdown độ rộng, Entity Picker Modal, Text Modal (script in [TEST]).
- `test_event_wiki_integration.py` – tích hợp Wikipedia cho block Sự kiện.
- `test_header_meta.py` – form header meta: tiêu đề, tag, độ khó.
- `test_hisgo_studio.py` – HISGO Studio: trang curriculum, tab Thư viện Lesson.
- `test_interactive_timeline_and_rules.py` – layout N×1, drawer media timeline, chèn divider dọc.
- `test_landing_public_api.py` – landing và trang CMS render dữ liệu từ API public.
- `test_leftbar_sticky_scroll.py` – leftbar sticky/scroll vẫn tương tác.
- `test_lesson_create_blocks.py` – /lessons/create có palette trái, click chèn vào TipTap, chuyển tab.
- `test_lesson_create_header_meta.py` – header meta form ở trang tạo bài.
- `test_lesson_drag_and_drop.py` – block draggable, HTML5 DnD, click chèn (hybrid).
- `test_lesson_editor.py` – kiểm tra trang editor TipTap: controls, form, sidebar tab, stepper thứ tự, timeline.
- `test_lesson_editor_improvements.py` – 7 cải tiến editor (header tối giản, thu gọn sidebar…).
- `test_lesson_left_sidebar.py` – TOC: render, chọn, thêm mục, quick jump.
- `test_lesson_timeline.py` – unit test logic timeline (bài đầu, chèn đầu/cuối, sửa không trùng).
- `test_navigation.py` – kiến trúc điều hướng, Curriculum Explorer, Knowledge Hub, route workspace.
- `test_row_section_builder.py` – block Hàng: cột mặc định, đổi số cột, preset tỉ lệ, resizer.
- `test_specialized_blocks_inline.py` – block Timeline/Nhân vật/Sự kiện chèn inline và sửa được.
- `test_wikidata_structured_data.py` – dữ liệu cấu trúc Wikidata.
- `test_wikipedia_integration.py` – tích hợp Wikipedia.

> Ghi chú: một số mô tả dựa trên đầu file/export/comment (không đọc toàn bộ thân file lớn).
