import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000/test-header-meta"

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

def test_header_meta_renders_properly(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    # 1. Kiểm tra render container của Header Meta Form
    form = driver.find_element(By.CSS_SELECTOR, "[data-testid='lesson-header-meta-form']")
    assert form.is_displayed(), "Form thông tin bài học ở đầu trang phải hiển thị"

    # 2. Kiểm tra input Tiêu đề bài học
    title_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='input-lesson-title']")
    assert title_input.is_displayed()
    assert "Kháng chiến chống Pháp" in title_input.get_attribute("value")

    # 3. Kiểm tra dropdown Chủ đề / Thời kỳ
    topic_select = driver.find_element(By.CSS_SELECTOR, "[data-testid='select-lesson-topic']")
    assert topic_select.is_displayed()
    assert topic_select.get_attribute("value") == "topic-1"

    # 4. Kiểm tra Độ khó
    diff_select = driver.find_element(By.CSS_SELECTOR, "[data-testid='select-difficulty']")
    assert diff_select.is_displayed()
    assert diff_select.get_attribute("value") == "MEDIUM"

    # 5. Kiểm tra Thẻ tags ban đầu có 3 thẻ
    tags = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='tag-chip-']")
    assert len(tags) == 3, f"Kỳ vọng 3 thẻ tag, thực tế {len(tags)}"

def test_update_lesson_title(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    title_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='input-lesson-title']")
    title_input.clear()
    title_input.send_keys("Chiến thắng Điện Biên Phủ 1954")
    time.sleep(0.5)

    inspect_title = driver.find_element(By.ID, "inspect-title").text
    assert "Điện Biên Phủ 1954" in inspect_title

def test_add_and_remove_tags(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    # Click thêm thẻ
    add_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-add-tag']")
    add_btn.click()
    time.sleep(0.3)

    tag_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='Nhập tên thẻ...']")
    tag_input.send_keys("Chiến dịch")
    
    save_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Lưu')]")
    save_btn.click()
    time.sleep(0.5)

    inspect_count = driver.find_element(By.ID, "inspect-tags-count").text
    assert "4 thẻ" in inspect_count, f"Sau khi thêm thẻ, số lượng phải là 4 thẻ, thực tế: {inspect_count}"

    # Xóa 1 thẻ
    remove_tag_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='tag-chip-Quân sự'] button")
    remove_tag_btn.click()
    time.sleep(0.5)

    inspect_count_after = driver.find_element(By.ID, "inspect-tags-count").text
    assert "3 thẻ" in inspect_count_after, f"Sau khi xóa, phải còn 3 thẻ, thực tế: {inspect_count_after}"

def test_update_difficulty(driver):
    driver.get(BASE_URL)
    time.sleep(1)

    diff_select = driver.find_element(By.CSS_SELECTOR, "[data-testid='select-difficulty']")
    Select(diff_select).select_by_value("HARD")
    time.sleep(0.5)

    inspect_diff = driver.find_element(By.ID, "inspect-difficulty").text
    assert "HARD" in inspect_diff
