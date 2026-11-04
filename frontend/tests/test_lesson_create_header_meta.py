import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager

URL = "http://localhost:3000/lessons/create"

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

def test_lesson_create_has_header_meta_form(driver):
    driver.get(URL)
    time.sleep(2)

    # 1. Header meta form container phải có mặt ở đầu trang soạn thảo
    form = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-header-meta-form']")
    assert form.is_displayed(), "Phần A (Thông tin bài học) phải hiển thị ở đầu trang /lessons/create"

def test_lesson_create_header_meta_fields_interaction(driver):
    driver.get(URL)
    time.sleep(2)

    # 2. Tiêu đề bài học
    title_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='input-lesson-title']")
    assert title_input.is_displayed()
    title_input.clear()
    title_input.send_keys("Kháng chiến chống quân Nguyên Mông lần thứ hai (1285)")
    assert "Kháng chiến" in title_input.get_attribute("value")

    # 3. Mô tả ngắn
    desc_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='textarea-short-desc']")
    desc_input.clear()
    desc_input.send_keys("Chiến thắng vẻ vang của quân dân nhà Trần trước 50 vạn quân xâm lược Nguyên Mông.")
    counter = driver.find_element(By.CSS_SELECTOR, "[data-testid='desc-counter']")
    assert "/200" in counter.text

    # 4. Độ khó
    diff_select = driver.find_element(By.CSS_SELECTOR, "[data-testid='select-difficulty']")
    Select(diff_select).select_by_value("HARD")
    assert diff_select.get_attribute("value") == "HARD"

    # 5. Toggle thời gian lịch sử
    date_toggle = driver.find_element(By.CSS_SELECTOR, "[data-testid='toggle-historical-dates']")
    date_toggle.click()
    time.sleep(0.5)

    date_fields = driver.find_element(By.CSS_SELECTOR, "[data-testid='historical-date-fields']")
    assert date_fields.is_displayed(), "Các trường ngày bắt đầu / kết thúc phải hiển thị khi bật toggle"
