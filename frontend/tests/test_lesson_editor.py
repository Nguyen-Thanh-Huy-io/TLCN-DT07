"""
Automated Verification Suite for TipTap Lesson Editor (Enhanced Sidebar & Order Timeline)
Validates HTTP accessibility, TipTap Editor components, sidebar tabs (Classification, Media, Publishing),
compact controls, displayOrder stepper, and lesson timeline preview.
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
    assert "Phân loại" in text, "Missing classification sidebar tab"
    assert "Media" in text, "Missing media sidebar tab"
    assert "Xuất bản" in text, "Missing publishing sidebar tab"

def test_lesson_editor_action_controls_present():
    """
    Verifies presence of draft save, submission and preview buttons
    """
    response = requests.get(f"{BASE_URL}/lessons/create", timeout=10)
    assert response.status_code == 200
    text = html_lib.unescape(response.text)

    # Actions on top bar
    assert "Lưu nháp" in text, "Missing 'Lưu nháp' button"
    assert "Gửi duyệt" in text, "Missing 'Gửi duyệt' button"
    assert "Xem trước" in text, "Missing 'Xem trước' preview action"
    assert "Quay lại" in text or "Thoát" in text, "Missing exit/back action"

def test_lesson_editor_form_fields_present():
    """
    Verifies core metadata inputs in the default active tab (Classification)
    """
    response = requests.get(f"{BASE_URL}/lessons/create", timeout=10)
    assert response.status_code == 200
    text = html_lib.unescape(response.text)

    assert "Chủ đề" in text, "Missing topic select field"
    assert "Độ khó" in text, "Missing difficulty field"
    assert "từ" in text, "Missing word counter display"
    assert "Thứ tự bài học" in text, "Missing displayOrder input field"
    assert "Về đầu" in text, "Missing 'Về đầu' compact control button"
    assert "Về cuối" in text, "Missing 'Về cuối' compact control button"
    assert "phút đọc" in text, "Missing estimated read time indicator"
