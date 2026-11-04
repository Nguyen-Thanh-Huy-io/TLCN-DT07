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

def test_timeline_block_inserts_inline_and_editable(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # 1. Chèn khối Timeline từ Block Palette bên trái
    timeline_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-TIMELINE']")
    timeline_btn.click()
    time.sleep(1)

    # 2. Xác nhận khối Timeline hiển thị trực tiếp inline bên trong TipTap editor
    editor = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box")
    timeline_container = editor.find_element(By.CSS_SELECTOR, "[data-testid='block-timeline-container']")
    assert timeline_container.is_displayed(), "Khối Timeline phải xuất hiện trực tiếp (inline) trong TipTap editor"

    # 3. Kiểm tra các ô soạn thảo inline trên khối Timeline
    title_input = timeline_container.find_element(By.CSS_SELECTOR, "[data-testid='input-timeline-title']")
    assert "Timeline" in title_input.get_attribute("value") or "Dòng thời gian" in title_input.get_attribute("value")

    # Thử chỉnh sửa tiêu đề trực tiếp
    title_input.clear()
    title_input.send_keys("Timeline — Kháng chiến Chống Pháp")
    assert title_input.get_attribute("value") == "Timeline — Kháng chiến Chống Pháp"

    # 4. Kiểm tra nút thêm mốc và nút chọn từ kho dữ liệu
    add_manual_btn = timeline_container.find_element(By.CSS_SELECTOR, "[data-testid='btn-add-manual-node']")
    assert add_manual_btn.is_displayed(), "Phải có nút thêm mốc thủ công"

    pick_event_btn = timeline_container.find_element(By.CSS_SELECTOR, "[data-testid='btn-pick-timeline-event']")
    assert pick_event_btn.is_displayed(), "Phải có nút chọn sự kiện từ kho tri thức"

def test_character_block_matches_img2_and_inline_editable(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # 1. Chèn khối Nhân vật
    char_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-CHARACTER']")
    char_btn.click()
    time.sleep(1)

    # 2. Xác nhận khối Nhân vật hiển thị inline bên trong TipTap editor
    editor = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box")
    char_container = editor.find_element(By.CSS_SELECTOR, "[data-testid='block-character-container']")
    assert char_container.is_displayed(), "Khối Nhân vật phải hiển thị trực tiếp inline trong TipTap editor"

    # 3. Kiểm tra cấu trúc chuẩn img2.png
    title_label = char_container.find_element(By.CSS_SELECTOR, "[data-testid='block-character-title']")
    assert "nhân vật" in title_label.text.lower()

    # Ô Tên nhân vật lịch sử
    name_input = char_container.find_element(By.CSS_SELECTOR, "[data-testid='input-character-name']")
    assert name_input.is_displayed()
    name_input.clear()
    name_input.send_keys("Đại tướng Võ Nguyên Giáp")
    assert name_input.get_attribute("value") == "Đại tướng Võ Nguyên Giáp"

    # Ô Năm sinh - năm mất
    years_input = char_container.find_element(By.CSS_SELECTOR, "[data-testid='input-character-years']")
    assert years_input.is_displayed()
    years_input.clear()
    years_input.send_keys("1911 – 2013")
    assert years_input.get_attribute("value") == "1911 – 2013"

    # Gợi ý chuẩn img2.png
    hint = char_container.find_element(By.CSS_SELECTOR, "[data-testid='character-block-hint']")
    assert "chọn từ kho dữ liệu" in hint.text

    # 4. Kiểm tra nút chọn từ kho dữ liệu & mở Modal
    pick_btn = char_container.find_element(By.CSS_SELECTOR, "[data-testid='btn-pick-character']")
    assert pick_btn.is_displayed()
    pick_btn.click()
    time.sleep(0.5)

    modal = driver.find_element(By.CSS_SELECTOR, "[data-testid='modal-entity-picker']")
    assert modal.is_displayed(), "Click nút chọn từ kho dữ liệu phải mở EntityPickerModal"

    # Đóng modal
    close_btn = modal.find_element(By.XPATH, ".//button[contains(text(), '✕')]")
    close_btn.click()
    time.sleep(0.5)

def test_event_block_matches_img3_and_inline_editable(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # 1. Chèn khối Sự kiện
    event_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-EVENT']")
    event_btn.click()
    time.sleep(1)

    # 2. Xác nhận khối Sự kiện hiển thị inline trong TipTap editor
    editor = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box")
    event_container = editor.find_element(By.CSS_SELECTOR, "[data-testid='block-event-container']")
    assert event_container.is_displayed(), "Khối Sự kiện phải hiển thị trực tiếp inline trong TipTap editor"

    # 3. Kiểm tra cấu trúc chuẩn img3.png
    title_label = event_container.find_element(By.CSS_SELECTOR, "[data-testid='block-event-title']")
    assert "sự kiện" in title_label.text.lower()

    # Ô Tên sự kiện
    name_input = event_container.find_element(By.CSS_SELECTOR, "[data-testid='input-event-name']")
    assert name_input.is_displayed()
    name_input.clear()
    name_input.send_keys("Chiến thắng Điện Biên Phủ")
    assert name_input.get_attribute("value") == "Chiến thắng Điện Biên Phủ"

    # Ô Thời gian • Địa điểm
    timeloc_input = event_container.find_element(By.CSS_SELECTOR, "[data-testid='input-event-timeloc']")
    assert timeloc_input.is_displayed()
    timeloc_input.clear()
    timeloc_input.send_keys("07/05/1954 • Điện Biên")
    assert timeloc_input.get_attribute("value") == "07/05/1954 • Điện Biên"

    # Ghi chú chân khối chuẩn img3.png
    diff_note = event_container.find_element(By.CSS_SELECTOR, "[data-testid='event-block-difference-note']")
    assert "dữ liệu liên kết đến thực thể Event" in diff_note.text
