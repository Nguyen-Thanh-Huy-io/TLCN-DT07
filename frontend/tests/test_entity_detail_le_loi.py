import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000/thuc-the/le-loi"


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


def test_le_loi_entity_hero_and_reading_experience(driver):
    driver.get(BASE_URL)
    time.sleep(2)

    # 1. Kiểm tra Tiêu đề & Badge loại thực thể
    title_el = driver.find_element(By.CSS_SELECTOR, ".ue-hero-title")
    assert "Lê Lợi" in title_el.text

    badge_el = driver.find_element(By.CSS_SELECTOR, ".ue-hero-badge")
    assert "nhân vật lịch sử" in badge_el.text.lower()

    # 2. Kiểm tra Quick Stats đã được chuẩn hóa (Hưởng thọ 48 tuổi, KHÔNG CÒN nhãn "Thời gian tồn tại")
    stats_section = driver.find_element(By.CSS_SELECTOR, ".ue-stats-grid")
    stats_text = stats_section.text.lower()
    assert "48 tuổi" in stats_text
    assert "hưởng thọ" in stats_text
    assert "thời gian tồn tại" not in stats_text

    # 3. Kiểm tra Cột phải Hero: có hình ảnh hoặc chân dung bảo tàng và hồ sơ tóm lược
    right_pane = driver.find_element(By.CSS_SELECTOR, ".ue-hero-right-pane")
    right_pane_text = right_pane.text.lower()
    assert "hồ sơ tóm lược" in right_pane_text

    # Nếu có tước hiệu, kiểm tra format không bị dính ngoặc đơn
    if "tước hiệu" in right_pane_text:
        assert "(5 năm" in right_pane.text

    # 4. Kiểm tra Thanh công cụ đọc (Reading Workspace Toolbar)
    toolbar = driver.find_element(By.CSS_SELECTOR, ".ue-reading-toolbar")
    assert "không gian đọc" in toolbar.text.lower()
    assert "mục lục" in toolbar.text.lower()

    # 5. Tương tác bộ chỉnh cỡ chữ (Aa-, Aa, Aa+)
    size_btn_lg = driver.find_element(By.CSS_SELECTOR, ".ue-size-btn[title='Cỡ chữ lớn']")
    size_btn_lg.click()
    time.sleep(0.5)

    article_col = driver.find_element(By.CSS_SELECTOR, ".ue-article-col")
    assert "ue-text-size-lg" in article_col.get_attribute("class")

    # 6. Kiểm tra chế độ Đọc toàn cảnh (Focus Mode)
    focus_btn = driver.find_element(By.CSS_SELECTOR, ".focus-mode-btn")
    focus_btn.click()
    time.sleep(0.5)

    layout_el = driver.find_element(By.CSS_SELECTOR, ".ue-layout")
    assert "ue-layout-focus-mode" in layout_el.get_attribute("class")
