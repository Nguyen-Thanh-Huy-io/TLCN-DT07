"""
Unit Tests for Lesson Timeline Logic and Strategy Pattern
"""

def simulate_lesson_timeline(topic_lessons, display_order, current_lesson_id=None, current_title=None):
    # Filter out current lesson if editing
    other_lessons = [l for l in topic_lessons if l.get("id") != current_lesson_id]
    sorted_siblings = sorted(other_lessons, key=lambda x: x.get("displayOrder", 0))

    target_order = max(1, int(display_order or 1))
    max_next_order = len(sorted_siblings) + 1

    preceding_lesson = None
    for idx, sib in enumerate(sorted_siblings):
        if idx + 1 < target_order:
            preceding_lesson = sib

    if len(sorted_siblings) == 0:
        explanation = "Là bài học đầu tiên trong chủ đề"
    elif target_order == 1:
        explanation = "Xếp ở đầu chủ đề (ưu tiên học trước)"
    elif target_order > len(sorted_siblings):
        last_lesson = sorted_siblings[-1]
        explanation = f'Đứng sau: "{last_lesson["title"]}" (cuối chủ đề)'
    elif preceding_lesson:
        explanation = f'Chèn sau: "{preceding_lesson["title"]}"'
    else:
        explanation = f"Xếp ở vị trí #{str(target_order).zfill(2)}"

    items = []
    current_inserted = False
    rank = 1

    current_name = (current_title or "").strip() or ("Bài học hiện tại" if current_lesson_id else "Bài mới đang nhập")

    for sib in sorted_siblings:
        if not current_inserted and rank >= target_order:
            items.append({
                "id": "__CURRENT__",
                "title": current_name,
                "displayOrder": rank,
                "isCurrent": True
            })
            rank += 1
            current_inserted = True

        items.append({
            "id": sib["id"],
            "title": sib["title"],
            "displayOrder": rank,
            "isCurrent": False,
            "isShifted": current_inserted
        })
        rank += 1

    if not current_inserted:
        items.append({
            "id": "__CURRENT__",
            "title": current_name,
            "displayOrder": rank,
            "isCurrent": True
        })

    return {
        "previewTimeline": items,
        "orderExplanationText": explanation,
        "maxNextOrder": max_next_order,
        "otherCount": len(sorted_siblings)
    }


def test_first_lesson_in_empty_topic():
    res = simulate_lesson_timeline([], display_order=1)
    assert res["orderExplanationText"] == "Là bài học đầu tiên trong chủ đề"
    assert len(res["previewTimeline"]) == 1
    assert res["previewTimeline"][0]["isCurrent"] is True
    assert res["previewTimeline"][0]["displayOrder"] == 1


def test_insert_at_beginning_of_topic():
    lessons = [
        {"id": "l1", "title": "Phong trào Đồng Khởi", "displayOrder": 1}
    ]
    res = simulate_lesson_timeline(lessons, display_order=1, current_title="Bài giới thiệu")
    assert res["orderExplanationText"] == "Xếp ở đầu chủ đề (ưu tiên học trước)"
    assert len(res["previewTimeline"]) == 2
    assert res["previewTimeline"][0]["isCurrent"] is True
    assert res["previewTimeline"][0]["displayOrder"] == 1
    assert res["previewTimeline"][1]["id"] == "l1"
    assert res["previewTimeline"][1]["displayOrder"] == 2
    assert res["previewTimeline"][1]["isShifted"] is True


def test_insert_at_end_of_topic():
    lessons = [
        {"id": "l1", "title": "Phong trào Đồng Khởi", "displayOrder": 1}
    ]
    res = simulate_lesson_timeline(lessons, display_order=2, current_title="Chiến dịch Bình Giã")
    assert 'Đứng sau: "Phong trào Đồng Khởi" (cuối chủ đề)' in res["orderExplanationText"]
    assert len(res["previewTimeline"]) == 2
    assert res["previewTimeline"][0]["id"] == "l1"
    assert res["previewTimeline"][0]["displayOrder"] == 1
    assert res["previewTimeline"][1]["isCurrent"] is True
    assert res["previewTimeline"][1]["displayOrder"] == 2


def test_edit_existing_lesson_no_duplication():
    lessons = [
        {"id": "l1", "title": "Bài 1", "displayOrder": 1},
        {"id": "l2", "title": "Bài 2", "displayOrder": 2}
    ]
    # Editing l1, moving to order 2
    res = simulate_lesson_timeline(lessons, display_order=2, current_lesson_id="l1", current_title="Bài 1 (Đã sửa)")
    assert len(res["previewTimeline"]) == 2
    assert res["otherCount"] == 1
    assert res["previewTimeline"][0]["id"] == "l2"
    assert res["previewTimeline"][0]["displayOrder"] == 1
    assert res["previewTimeline"][1]["isCurrent"] is True
    assert res["previewTimeline"][1]["title"] == "Bài 1 (Đã sửa)"
    assert res["previewTimeline"][1]["displayOrder"] == 2

def test_clamping_excessive_order_prevents_gap():
    lessons = [
        {"id": "l1", "title": "Phong trào Đồng Khởi", "displayOrder": 1}
    ]
    # In a topic with 1 lesson, maximum allowed is 2
    res = simulate_lesson_timeline(lessons, display_order=6, current_title="Bài thử nghiệm")
    max_allowed = res["maxNextOrder"]
    assert max_allowed == 2, f"Expected max 2 in topic with 1 lesson, got {max_allowed}"
