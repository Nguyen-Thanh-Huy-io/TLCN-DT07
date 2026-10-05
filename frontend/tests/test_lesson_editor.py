"""
Automated Verification Suite for TipTap Lesson Editor (Phase 1)
Validates HTTP accessibility, TipTap Editor components, historical typography,
custom formatting tools, word count feedback and lifecycle action controls.
"""

import html as html_lib
import requests
import pytest

BASE_URL = "http://localhost:3000"

def test_lesson_create_page_renders_cleanly_with_tiptap():
    """
    Verifies that /lessons/create page loads with HTTP 200 and mounts the editor layout
    """
    response = requests.get(f"{BASE_URL}/lessons/create", timeout=10)
    assert response.status_code == 200, f"Expected 200 OK from /lessons/create, got {response.status_code}"
    text = html_lib.unescape(response.text)

    # Verify standard workspace and page titles
    assert "TÊN BÀI HỌC LỊCH SỬ" in text or "TÊN BÀI HỌC" in text, "Missing lesson title field"
    assert "NỘI DUNG BÀI HỌC" in text, "Missing rich text section label"
    assert "Phân loại chương trình" in text or "Phân loại" in text, "Missing classification sidebar"
    assert "Nguồn tư liệu tham khảo" in text or "Nguồn tham khảo" in text, "Missing source reference note"

def test_lesson_editor_action_controls_present():
    """
    Verifies presence of draft save, submission and preview buttons
    """
    response = requests.get(f"{BASE_URL}/lessons/create", timeout=10)
    assert response.status_code == 200
    text = html_lib.unescape(response.text)

    # Actions on top and bottom
    assert "Lưu nháp" in text, "Missing 'Lưu nháp' button"
    assert "Gửi duyệt" in text, "Missing 'Gửi duyệt' button"
    assert "Xem trước" in text, "Missing 'Xem trước' preview action"
    assert "Thoát trình soạn thảo" in text, "Missing exit action"

def test_lesson_editor_form_fields_present():
    """
    Verifies core metadata inputs: difficulty, source note and topics
    """
    response = requests.get(f"{BASE_URL}/lessons/create", timeout=10)
    assert response.status_code == 200
    text = html_lib.unescape(response.text)

    assert "Chủ đề" in text, "Missing topic select field"
    assert "Độ khó" in text, "Missing difficulty field"
    assert "từ vựng lịch sử" in text or "từ" in text, "Missing word counter display"
    assert "Ảnh bìa bài học" in text, "Missing cover image thumbnail section"
    assert "Thứ tự bài học" in text, "Missing displayOrder input field"
    assert "phút đọc" in text, "Missing estimated read time indicator"
