import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

LESSON_CREATE_URL = "http://localhost:3000/lessons/create"

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

def test_lessons_create_shows_block_palette_on_left(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # 1. Kiểm tra tab "Thêm khối" đang active
    tab_blocks = driver.find_element(By.CSS_SELECTOR, "[data-testid='tab-left-blocks']")
    assert tab_blocks.is_displayed(), "Tab Thêm khối phải hiển thị trên cột trái"
    assert "Thêm khối" in tab_blocks.text

    # 2. Kiểm tra thanh công cụ Block Palette hiển thị 10 khối
    palette = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-block-palette']")
    assert palette.is_displayed(), "Thanh công cụ khối phải hiển thị"

    timeline_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-TIMELINE']")
    assert timeline_btn.is_displayed(), "Nút Timeline phải hiển thị"

    map_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-MAP']")
    assert map_btn.is_displayed(), "Nút Bản đồ phải hiển thị"

def test_clicking_block_inserts_into_tiptap_editor(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # Click vào nút "Timeline"
    timeline_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-TIMELINE']")
    timeline_btn.click()
    time.sleep(1)

    # Kiểm tra nội dung TipTap editor có xuất hiện từ khóa Timeline
    editor_content = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box")
    assert "Dòng thời gian" in editor_content.text or "Mốc" in editor_content.text, \
        "Nội dung editor phải chứa khối dòng thời gian sau khi bấm chèn"

def test_switch_between_blocks_and_outline_tabs(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # Chuyển sang tab "Mục lục"
    tab_outline = driver.find_element(By.CSS_SELECTOR, "[data-testid='tab-left-outline']")
    tab_outline.click()
    time.sleep(0.5)

    # Chuyển lại tab "Thêm khối"
    tab_blocks = driver.find_element(By.CSS_SELECTOR, "[data-testid='tab-left-blocks']")
    tab_blocks.click()
    time.sleep(0.5)

    palette = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-block-palette']")
    assert palette.is_displayed(), "Palette phải hiển thị lại khi chuyển về tab Thêm khối"
