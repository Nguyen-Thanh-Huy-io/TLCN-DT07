import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000/test-left-sidebar"

@pytest.fixture(scope="module")
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()

def test_left_sidebar_renders_properly(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    # 1. Kiểm tra render Sidebar
    sidebar = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-left-sidebar']")
    assert sidebar.is_displayed(), "Sidebar phải hiển thị đầy đủ"

    # 2. Kiểm tra Card tóm tắt bài học & Loại bài học
    type_badge = driver.find_element(By.CSS_SELECTOR, "[data-testid='badge-lesson-type']")
    assert "SỰ KIỆN" in type_badge.text, "Badge loại bài học phải là SỰ KIỆN"

    title_elem = driver.find_element(By.CSS_SELECTOR, "[data-testid='sidebar-lesson-title']")
    assert "Điện Biên Phủ" in title_elem.text, "Tiêu đề bài học phải chứa Điện Biên Phủ"

    # 3. Kiểm tra Card Mục lục ToC render 7 mục
    toc_items = driver.find_elements(By.CSS_SELECTOR, "[data-testid='toc-item-list'] > [data-testid^='toc-item-']")
    assert len(toc_items) == 7, f"Kỳ vọng 7 mục ToC, thực tế {len(toc_items)}"

    # 4. Kiểm tra Card Thiết lập nhanh
    quick_settings = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-quick-settings-card']")
    assert quick_settings.is_displayed(), "Card Thiết lập nhanh phải hiển thị"

    # 5. Kiểm tra Card ngữ cảnh bài học
    guidance = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-guidance-card']")
    assert "nguyên nhân, diễn biến" in guidance.text, "Guidance text phải xuất hiện"

def test_select_toc_item(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    # Click vào mục ToC sec-2-1
    target_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='toc-item-sec-2-1'] button")
    target_btn.click()
    time.sleep(0.5)

    active_heading = driver.find_element(By.ID, "test-active-heading").text
    assert active_heading == "sec-2-1", "Trạng thái active heading phải là sec-2-1"

def test_add_toc_item(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    add_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-add-toc-item']")
    add_btn.click()
    time.sleep(0.5)

    toc_count = driver.find_element(By.ID, "test-toc-count").text
    assert toc_count == "8", f"Số lượng ToC sau khi thêm phải là 8, thực tế: {toc_count}"

def test_quick_jump_actions(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    timeline_jump = driver.find_element(By.CSS_SELECTOR, "[data-testid='quick-jump-TIMELINE']")
    timeline_jump.click()
    time.sleep(0.5)

    last_jump = driver.find_element(By.ID, "test-last-jump").text
    assert last_jump == "TIMELINE", f"Kỳ vọng TIMELINE, thực tế {last_jump}"

def test_collapse_and_expand_sidebar(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    collapse_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-collapse-sidebar']")
    collapse_btn.click()
    time.sleep(0.5)

    collapsed_sidebar = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-left-sidebar-collapsed']")
    assert collapsed_sidebar.is_displayed(), "Sidebar ở chế độ thu gọn phải hiển thị"

    expand_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-expand-sidebar']")
    expand_btn.click()
    time.sleep(0.5)

    full_sidebar = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-left-sidebar']")
    assert full_sidebar.is_displayed(), "Sidebar mở rộng trở lại bình thường"
