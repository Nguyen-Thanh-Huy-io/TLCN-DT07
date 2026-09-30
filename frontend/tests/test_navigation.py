"""
Automated Verification Suite for Navigation Information Architecture, Layout Standards, Curriculum Explorer & Knowledge Hub
Validates HTTP accessibility, HTML layout structure (.page and .page-title), 5 Core Workspaces Segregation, Tree Navigation, and Horizontal Tabs.
"""

import html as html_lib
import requests
import pytest

BASE_URL = "http://localhost:3000"

def test_homepage_serves_navigation_groups_and_streamlined_sidebar():
    response = requests.get(f"{BASE_URL}/", timeout=10)
    assert response.status_code == 200, f"Expected 200 OK from home, got {response.status_code}"
    text = html_lib.unescape(response.text)

    # Verify that the 4 core business groups exist
    assert "TỔNG QUAN" in text, "Missing group: TỔNG QUAN"
    assert "CHƯƠNG TRÌNH HỌC" in text, "Missing group: CHƯƠNG TRÌNH HỌC"
    assert "TỪ ĐIỂN TRI THỨC" in text, "Missing group: TỪ ĐIỂN TRI THỨC"
    assert "KIỂM DUYỆT & VẬN HÀNH" in text, "Missing group: KIỂM DUYỆT & VẬN HÀNH"

    # Verify streamlined 5 core workspace items exist on Sidebar
    assert "Dashboard" in text, "Missing item: Dashboard"
    assert "Chương trình học" in text, "Missing item: Chương trình học"
    assert "Từ điển tri thức" in text, "Missing item: Từ điển tri thức"
    assert "Duyệt bài học" in text, "Missing item: Duyệt bài học"
    assert "Người dùng & Quyền" in text or "Người dùng" in text, "Missing item: Người dùng"

    # Verify standard layout wrappers exist
    assert "class=\"page\"" in text or 'class="page"' in text, "Missing layout container <main class='page'>"
    assert "class=\"page-title\"" in text or 'class="page-title"' in text, "Missing standard header <div class='page-title'>"

def test_curriculum_explorer_renders_view_switcher_tree_and_detail():
    response = requests.get(f"{BASE_URL}/curriculum", timeout=10)
    assert response.status_code == 200, f"Expected 200 OK from /curriculum, got {response.status_code}"
    text = html_lib.unescape(response.text)

    # View switcher buttons
    assert "Sơ đồ Cây Phân Cấp" in text, "Missing Tree view button in /curriculum"
    assert "DS Giai đoạn" in text, "Missing Periods table link in /curriculum"
    assert "DS Chủ đề" in text, "Missing Topics table link in /curriculum"
    assert "DS Bài học & Quiz" in text, "Missing Lessons table link in /curriculum"

    # Resizable Divider
    assert "curriculum-resizer-divider" in text, "Missing resizable split divider"

    # Quick Filters
    assert "Tất cả" in text, "Missing All filter pill"
    assert "Giai đoạn" in text, "Missing Periods filter pill"

    # Tree items & Ancestor Trail
    assert "Thời kỳ Bắc thuộc" in text, "Missing sample period in /curriculum tree"
    assert "Thời kỳ Lý - Trần - Hồ" in text, "Missing period Lý - Trần - Hồ in tree"
    assert "GIAI ĐOẠN LỊCH SỬ" in text, "Missing initial level 1 detail card in /curriculum"
    assert "ancestor-trail" in text, "Missing ancestor trail breadcrumbs in detail pane"

def test_knowledge_hub_renders_tabs_and_content():
    response = requests.get(f"{BASE_URL}/knowledge", timeout=10)
    assert response.status_code == 200, f"Expected 200 OK from /knowledge, got {response.status_code}"
    text = html_lib.unescape(response.text)

    # Standard Page Header
    assert "Từ điển tri thức" in text, "Missing title in /knowledge"
    assert "Địa danh & Di tích" in text, "Missing tab: Địa danh & Di tích"
    assert "Nhân vật & Triều đại" in text, "Missing tab: Nhân vật & Triều đại"
    assert "Dòng sự kiện lịch sử" in text, "Missing tab: Dòng sự kiện lịch sử"
    assert "Thẻ phân loại" in text, "Missing tab: Thẻ phân loại"

@pytest.mark.parametrize("route,expected_title", [
    ("/curriculum", "Chương trình học"),
    ("/knowledge", "Từ điển tri thức"),
    ("/periods", "Giai đoạn lịch sử"),
    ("/topics", "Chủ đề học tập"),
    ("/lessons", "Bài học & Quiz"),
    ("/locations", "Địa danh lịch sử"),
    ("/entities", "Nhân vật lịch sử"),
    ("/events", "Sự kiện lịch sử"),
    ("/tags", "Thẻ phân loại"),
    ("/review", "Duyệt bài học"),
    ("/users", "Người dùng & Quyền"),
])
def test_workspace_routes_render_cleanly(route, expected_title):
    response = requests.get(f"{BASE_URL}{route}", timeout=10)
    assert response.status_code == 200, f"Route {route} failed with status {response.status_code}"
    text = html_lib.unescape(response.text)
    assert expected_title in text, f"Route {route} does not contain '{expected_title}'"
    # Verify standard layout page wrapper on every route
    assert "class=\"page\"" in text or 'class="page"' in text, f"Route {route} missing <main class='page'>"

