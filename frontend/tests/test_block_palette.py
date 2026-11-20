import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000/test-block-palette"

EXPECTED_BLOCKS = [
    ("TEXT", "Văn bản"),
    ("IMAGE", "Hình ảnh"),
    ("VIDEO", "Video"),
    ("TIMELINE", "Timeline"),
    ("MAP", "Bản đồ"),
    ("CHARACTER", "Nhân vật"),
    ("EVENT", "Sự kiện"),
    ("COMPARISON_TABLE", "Bảng so sánh"),
    ("QUIZ", "Câu hỏi ôn tập"),
    ("RESOURCE_LINK", "Tư liệu & liên kết"),
]

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

def test_palette_renders_all_10_blocks(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    # 1. Kiểm tra render container của palette
    palette = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-block-palette']")
    assert palette.is_displayed(), "Thanh công cụ Block Palette phải hiển thị"

    # 2. Kiểm tra render đủ 10 nút bấm loại khối
    for block_type, expected_label in EXPECTED_BLOCKS:
        btn = driver.find_element(By.CSS_SELECTOR, f"[data-testid='btn-block-{block_type}']")
        assert btn.is_displayed(), f"Nút khối {block_type} phải hiển thị"
        assert expected_label in btn.text, f"Nút {block_type} phải chứa nhãn '{expected_label}'"

def test_click_block_triggers_selection(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    # Click vào khối TIMELINE
    timeline_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-TIMELINE']")
    timeline_btn.click()
    time.sleep(0.5)

    # Kiểm tra nhãn hiển thị bên bảng kết quả
    selected_label = driver.find_element(By.ID, "test-selected-label").text
    assert selected_label == "Timeline", f"Kỳ vọng 'Timeline', thực tế '{selected_label}'"

    selected_type = driver.find_element(By.ID, "test-selected-type").text
    assert "(TIMELINE)" in selected_type

    # Click tiếp vào khối BẢN ĐỒ
    map_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-MAP']")
    map_btn.click()
    time.sleep(0.5)

    selected_label_after = driver.find_element(By.ID, "test-selected-label").text
    assert selected_label_after == "Bản đồ", f"Kỳ vọng 'Bản đồ', thực tế '{selected_label_after}'"

def test_click_history_tracking(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    # Click 3 khối liên tiếp
    for block_type, _ in EXPECTED_BLOCKS[:3]:
        btn = driver.find_element(By.CSS_SELECTOR, f"[data-testid='btn-block-{block_type}']")
        btn.click()
        time.sleep(0.2)

    history_items = driver.find_elements(By.CSS_SELECTOR, "#test-click-history li")
    assert len(history_items) == 3, f"Lịch sử click phải ghi nhận 3 mục, thực tế {len(history_items)}"
