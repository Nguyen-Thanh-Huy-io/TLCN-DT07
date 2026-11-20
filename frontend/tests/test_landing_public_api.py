import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000"


@pytest.fixture(scope="module")
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    service = Service(ChromeDriverManager().install())
    web_driver = webdriver.Chrome(service=service, options=options)
    web_driver.implicitly_wait(10)
    yield web_driver
    web_driver.quit()


def scroll_and_get_text(driver, element_id: str) -> str:
    section = driver.find_element(By.ID, element_id)
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", section)
    return section.get_attribute("textContent") or ""


def test_landing_page_renders_dynamic_periods_chapters_and_knowledge_from_api(driver):
    driver.get(BASE_URL)

    # 1. Kiểm tra section Timeline (#timeline) hiển thị giai đoạn từ DB seed
    timeline_text = scroll_and_get_text(driver, "timeline")
    assert "Kháng chiến chống Mỹ, cứu nước (1954 - 1975)" in timeline_text
    assert "(1954 - 1975)" in timeline_text

    # 2. Kiểm tra section Những chương sử đáng nhớ (#chuong-su) hiển thị chủ đề isFeatured từ DB
    chapters_text = scroll_and_get_text(driver, "chuong-su")
    assert "GIAI ĐOẠN 1954 - 1960" in chapters_text
    assert "Phong trào Đồng Khởi" in chapters_text

    # 3. Kiểm tra section Khám phá theo giai đoạn (#giai-doan) hiển thị giai đoạn từ DB
    eras_text = scroll_and_get_text(driver, "giai-doan")
    assert "Kháng chiến chống Mỹ, cứu nước (1954 - 1975)" in eras_text

    # 4. Kiểm tra section Kiến thức lịch sử (#kien-thuc) hiển thị 6 chủ đề THEMATIC từ DB
    knowledge_text = scroll_and_get_text(driver, "kien-thuc")
    assert "Văn hóa & Đời sống" in knowledge_text
    assert "Kiến trúc & Di tích" in knowledge_text
    assert "Chiến tranh & Ngoại giao" in knowledge_text

    # 5. Kiểm tra section Nhân vật tiêu biểu (#nhan-vat) hiển thị 6 nhân vật từ DB
    figures_text = scroll_and_get_text(driver, "nhan-vat")
    assert "Chủ tịch Hồ Chí Minh" in figures_text
    assert "Đại tướng Võ Nguyên Giáp" in figures_text
    assert "Nữ tướng Nguyễn Thị Định" in figures_text


def test_cms_entities_page_renders_seeded_historical_entities(driver):
    from selenium.webdriver.support.ui import WebDriverWait

    driver.get(f"{BASE_URL}/entities")
    WebDriverWait(driver, 15).until(
        lambda d: "Chủ tịch Hồ Chí Minh"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    body = driver.find_element(By.TAG_NAME, "body")
    text = body.get_attribute("textContent") or ""
    assert "Chủ tịch Hồ Chí Minh" in text
    assert "Đoàn 559 - Bộ đội Trường Sơn" in text
    assert "Xe tăng T-54B số hiệu 843 & 390" in text


def test_cms_locations_page_renders_seeded_historical_locations(driver):
    from selenium.webdriver.support.ui import WebDriverWait

    driver.get(f"{BASE_URL}/locations")
    WebDriverWait(driver, 15).until(
        lambda d: "Dinh Độc Lập (Hội trường Thống Nhất)"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    body = driver.find_element(By.TAG_NAME, "body")
    text = body.get_attribute("textContent") or ""
    assert "Dinh Độc Lập (Hội trường Thống Nhất)" in text
    assert "Khu di tích lịch sử Địa đạo Củ Chi" in text
    assert "Thành cổ Quảng Trị" in text
    assert "10.7770, 106.6953" in text


def test_cms_events_page_renders_seeded_historical_events(driver):
    from selenium.webdriver.support.ui import WebDriverWait

    driver.get(f"{BASE_URL}/events")
    WebDriverWait(driver, 15).until(
        lambda d: "Phong trào Đồng Khởi Bến Tre bùng nổ"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    body = driver.find_element(By.TAG_NAME, "body")
    text = body.get_attribute("textContent") or ""
    # Kiểm tra 5 cột đặc thù của Sự kiện: Tên sự kiện, Thời gian, Địa điểm, Giai đoạn, Trạng thái
    assert "Tên sự kiện" in text
    assert "Thời gian" in text
    assert "Địa điểm" in text
    assert "Giai đoạn" in text
    assert "Trạng thái" in text
    assert "Phong trào Đồng Khởi Bến Tre bùng nổ" in text
    assert "1959 – 1960" in text
    assert "Khu di tích Đồng Khởi Bến Tre" in text

    # Bấm vào liên kết sự kiện để sang trang chi tiết EntityDetailLayout (/events/[id])
    event_link = driver.find_element(By.LINK_TEXT, "Phong trào Đồng Khởi Bến Tre bùng nổ")
    driver.execute_script("arguments[0].click();", event_link)

    WebDriverWait(driver, 15).until(
        lambda d: "CÁC PHẦN CỦA BIỂU MẪU"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    detail_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    assert "CÁC PHẦN CỦA BIỂU MẪU" in detail_text
    assert "1. Thông tin cơ bản" in detail_text
    assert "2. Thời gian & địa điểm" in detail_text
    assert "3. Nội dung lịch sử" in detail_text
    assert "4. Quan hệ tri thức" in detail_text
    assert "5. Tài liệu" in detail_text
    assert "6. Kiểm duyệt & xuất bản" in detail_text
    assert "Xem trước" in detail_text
    assert "Sao chép dữ liệu mẫu" in detail_text
    assert "Mục 1/6" in detail_text

    # Bấm vào mục "6. Kiểm duyệt & xuất bản" ở Left Bar để kiểm tra nội dung mục 6 giống abc.png
    step6_btn = driver.find_element(
        By.XPATH, "//button[contains(., '6. Kiểm duyệt & xuất bản')]"
    )
    driver.execute_script("arguments[0].click();", step6_btn)

    WebDriverWait(driver, 10).until(
        lambda d: "Kiểm tra dữ liệu trước khi hiển thị trên trang học lịch sử."
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    step6_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    assert "Mục 6/6" in step6_text
    assert "Niên đại" in step6_text
    assert "Nguồn và quan hệ" in step6_text
    assert "Chờ kiểm duyệt" in step6_text


def test_cms_review_page_renders_seeded_pending_lessons(driver):
    from selenium.webdriver.support.ui import WebDriverWait

    driver.get(f"{BASE_URL}/review")
    WebDriverWait(driver, 15).until(
        lambda d: "Tuyến đường vận tải chiến lược Trường Sơn"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    body = driver.find_element(By.TAG_NAME, "body")
    text = body.get_attribute("textContent") or ""
    assert "Tuyến đường vận tải chiến lược Trường Sơn" in text
    assert "81 ngày đêm bảo vệ Thành cổ Quảng Trị mùa hè đỏ lửa 1972" in text


def test_public_detail_pages_render_knowledge_graph_content(driver):
    from selenium.webdriver.support.ui import WebDriverWait

    # 1. Trang chi tiết Giai đoạn (/giai-doan/[slug])
    driver.get(
        f"{BASE_URL}/giai-doan/khang-chien-chong-my-cuu-nuoc-1954-1975"
    )
    WebDriverWait(driver, 15).until(
        lambda d: "Các Chương sử & Chuyên đề trọng tâm"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    period_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    assert "Kháng chiến chống Mỹ, cứu nước (1954 - 1975)" in period_text
    assert "Phong trào Đồng Khởi Bến Tre bùng nổ" in period_text

    # 2. Trang chi tiết Chương sử (/chuong-su/[slug])
    driver.get(
        f"{BASE_URL}/chuong-su/giai-doan-1954-1960-giu-gin-luc-luong-va-phong-trao-dong-khoi"
    )
    WebDriverWait(driver, 15).until(
        lambda d: "Nội dung Bài học Lịch sử"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    chapter_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    assert "Phong trào Đồng Khởi (1959 - 1960)" in chapter_text
    assert "Nữ tướng Nguyễn Thị Định" in chapter_text
    assert "Khu di tích Đồng Khởi Bến Tre" in chapter_text

    # 3. Trang chi tiết Nhân vật (/nhan-vat/[slug])
    driver.get(f"{BASE_URL}/nhan-vat/nu-tuong-nguyen-thi-dinh")
    WebDriverWait(driver, 15).until(
        lambda d: "Tiểu sử & Dấu ấn lịch sử"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    figure_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    assert "Nữ tướng Nguyễn Thị Định" in figure_text
    assert "Bài học Lịch sử liên quan" in figure_text


def test_cms_entities_and_locations_view_and_edit_modals(driver):
    from selenium.webdriver.support.ui import WebDriverWait

    # 1. Mở trang CMS Thực thể (/entities) và bấm nút "Xem chi tiết"
    driver.get(f"{BASE_URL}/entities")
    WebDriverWait(driver, 15).until(
        lambda d: "Chủ tịch Hồ Chí Minh"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    view_btn = driver.find_element(By.CSS_SELECTOR, 'button[title="Xem chi tiết"]')
    driver.execute_script("arguments[0].click();", view_btn)

    WebDriverWait(driver, 10).until(
        lambda d: "Chi tiết Nhân vật / Thực thể lịch sử"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    modal_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    assert "Chi tiết Nhân vật / Thực thể lịch sử" in modal_text
    assert "Chỉnh sửa ngay" in modal_text

    # 2. Mở trang CMS Địa danh (/locations) và bấm nút "Chỉnh sửa"
    driver.get(f"{BASE_URL}/locations")
    WebDriverWait(driver, 15).until(
        lambda d: "Dinh Độc Lập (Hội trường Thống Nhất)"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    edit_btn = driver.find_element(By.CSS_SELECTOR, 'button[title="Chỉnh sửa"]')
    driver.execute_script("arguments[0].click();", edit_btn)

    WebDriverWait(driver, 10).until(
        lambda d: "Chỉnh sửa Địa danh / Di tích lịch sử"
        in (d.find_element(By.TAG_NAME, "body").get_attribute("textContent") or "")
    )
    loc_modal_text = driver.find_element(By.TAG_NAME, "body").get_attribute("textContent") or ""
    assert "Chỉnh sửa Địa danh / Di tích lịch sử" in loc_modal_text
    assert "Lưu thay đổi" in loc_modal_text







