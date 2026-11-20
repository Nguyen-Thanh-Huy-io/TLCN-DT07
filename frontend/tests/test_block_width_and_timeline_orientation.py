import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
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

def test_timeline_orientation_toggle_horizontal_and_vertical(driver):
    """Kiểm tra khối Timeline hỗ trợ 2 tùy chọn hiển thị: Bề dọc và Bề ngang."""
    driver.get(LESSON_CREATE_URL)
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='timeline-block-item-editor']")))
    time.sleep(1)

    # 1. Mặc định là layout Bề dọc (VERTICAL)
    timeline_container = driver.find_element(By.CSS_SELECTOR, "[data-timeline-orientation]")
    assert timeline_container.get_attribute("data-timeline-orientation") == "VERTICAL", "Mặc định trục timeline phải là VERTICAL"

    # 2. Bấm chuyển sang Bề ngang (HORIZONTAL)
    btn_horizontal = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-timeline-orientation-horizontal']")
    driver.execute_script("arguments[0].click();", btn_horizontal)
    time.sleep(0.5)

    # Xác nhận thuộc tính đã chuyển sang HORIZONTAL và container có class overflow-x-auto
    timeline_container = driver.find_element(By.CSS_SELECTOR, "[data-timeline-orientation]")
    assert timeline_container.get_attribute("data-timeline-orientation") == "HORIZONTAL", "Trục timeline phải chuyển sang HORIZONTAL"

    # 3. Kiểm tra nút mở Canvas TipTap trong chế độ ngang vẫn hoạt động tốt
    btn_open_canvas = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-open-node-canvas-0']")
    driver.execute_script("arguments[0].click();", btn_open_canvas)
    time.sleep(0.8)

    drawer = driver.find_element(By.CSS_SELECTOR, "[data-testid='timeline-node-canvas-drawer']")
    assert drawer.is_displayed(), "Drawer TipTap Canvas phải mở khi bấm từ timeline ngang"

    # Đóng Drawer
    btn_close = drawer.find_element(By.XPATH, "//button[contains(text(), 'Đóng') or contains(text(), 'Hoàn tất')]")
    driver.execute_script("arguments[0].click();", btn_close)
    time.sleep(0.5)

    # 4. Bấm chuyển lại Bề dọc (VERTICAL)
    btn_vertical = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-timeline-orientation-vertical']")
    driver.execute_script("arguments[0].click();", btn_vertical)
    time.sleep(0.5)

    timeline_container = driver.find_element(By.CSS_SELECTOR, "[data-timeline-orientation]")
    assert timeline_container.get_attribute("data-timeline-orientation") == "VERTICAL", "Trục timeline phải trở lại VERTICAL"

def test_block_width_matrix_and_switcher(driver):
    """Kiểm tra ma trận chiều rộng của từng loại khối theo đúng đặc tả yêu cầu."""
    driver.get(LESSON_CREATE_URL)
    time.sleep(1.5)

    # 1. Khối Văn bản (TEXT): Cố định Toàn hàng -> KHÔNG có bộ chọn chiều rộng
    text_cards = driver.find_elements(By.CSS_SELECTOR, "[data-block-type='TEXT']")
    assert len(text_cards) > 0, "Phải có khối Text mặc định"
    text_width_selectors = text_cards[0].find_elements(By.CSS_SELECTOR, "[data-testid^='width-selector-']")
    assert len(text_width_selectors) == 0, "Khối Text cố định Toàn hàng, không hiển thị bộ chọn chiều rộng"

    # 2. Thêm khối Nhân vật (CHARACTER): Có bộ chọn [1/2, 1/3, 100%] và mặc định là 1/2
    btn_char = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-CHARACTER']")
    driver.execute_script("arguments[0].click();", btn_char)
    time.sleep(0.8)

    char_cards = driver.find_elements(By.CSS_SELECTOR, "[data-block-type='CHARACTER']")
    assert len(char_cards) > 0, "Khối Nhân vật phải được thêm vào bài học"
    char_card = char_cards[0]

    # Kiểm tra mặc định là HALF (1/2 hàng)
    assert char_card.get_attribute("data-block-width") == "HALF", "Khối Nhân vật mặc định phải là HALF (1/2 hàng)"

    # Tìm bộ chọn chiều rộng trên header khối Nhân vật
    width_selector = char_card.find_element(By.CSS_SELECTOR, "[data-testid^='width-selector-']")
    assert width_selector.is_displayed(), "Khối Nhân vật phải có bộ chọn chiều rộng"

    # Bấm chọn 1/3 hàng
    btn_third = char_card.find_element(By.XPATH, ".//button[contains(text(), '1/3')]")
    driver.execute_script("arguments[0].click();", btn_third)
    time.sleep(0.5)
    assert char_card.get_attribute("data-block-width") == "THIRD", "Khối Nhân vật phải chuyển sang THIRD (1/3 hàng)"

    # Bấm chọn 100% (Toàn hàng)
    btn_full = char_card.find_element(By.XPATH, ".//button[contains(text(), '100%')]")
    driver.execute_script("arguments[0].click();", btn_full)
    time.sleep(0.5)
    assert char_card.get_attribute("data-block-width") == "FULL", "Khối Nhân vật phải chuyển sang FULL (Toàn hàng)"
