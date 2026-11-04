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

def test_initial_canvas_and_blocks_rendered(driver):
    """Kiểm tra Canvas Builder khởi tạo với các khối mặc định (Text và Timeline)."""
    driver.get(LESSON_CREATE_URL)
    wait = WebDriverWait(driver, 10)
    
    # 1. Canvas hiển thị
    canvas = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='block-builder-canvas']")))
    assert canvas.is_displayed(), "Khung BlockBuilderCanvas phải hiển thị"

    # 2. Các thẻ bao bọc BlockCardWrapper
    block_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    assert len(block_cards) >= 2, f"Khởi tạo phải có ít nhất 2 khối mặc định, thực tế: {len(block_cards)}"

    # 3. Khối đầu tiên là TEXT và khối thứ hai là TIMELINE
    assert block_cards[0].get_attribute("data-block-type") == "TEXT", "Khối đầu tiên phải là TEXT"
    assert block_cards[1].get_attribute("data-block-type") == "TIMELINE", "Khối thứ hai phải là TIMELINE"

def test_insert_block_via_left_palette(driver):
    """Kiểm tra chèn khối chuyên biệt Nhân vật (CHARACTER) từ thanh Block Palette bên trái."""
    driver.get(LESSON_CREATE_URL)
    time.sleep(1.5)
    
    # Đếm số khối hiện tại
    initial_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    initial_count = len(initial_cards)

    # Click nút thêm khối Nhân vật từ palette bên trái
    character_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-CHARACTER']")
    character_btn.click()
    time.sleep(1)

    # Số lượng khối tăng lên 1
    new_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    assert len(new_cards) == initial_count + 1, "Số lượng khối phải tăng thêm 1 sau khi chèn từ Palette"

    # Khối mới thêm vào ở cuối có kiểu CHARACTER
    last_block = new_cards[-1]
    assert last_block.get_attribute("data-block-type") == "CHARACTER", "Khối mới chèn phải có type CHARACTER"
    
    # Khối Nhân vật có nút Tra cứu Kho tri thức
    pick_btn = last_block.find_element(By.CSS_SELECTOR, "[data-testid='btn-pick-character']")
    assert pick_btn.is_displayed(), "Khối Nhân vật phải có nút Tra cứu Kho tri thức"

def test_insert_block_via_divider_button(driver):
    """Kiểm tra bấm nút [+ Chèn khối] tại vạch chèn giữa các khối (AddBlockDivider)."""
    driver.get(LESSON_CREATE_URL)
    time.sleep(1.5)

    cards_before = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    count_before = len(cards_before)

    # Click nút [+] tại vạch chèn đầu trang (insertIndex = 0)
    btn_divider_0 = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-insert-block-0']")
    # Dùng execute_script click để không bị che bởi hover state
    driver.execute_script("arguments[0].click();", btn_divider_0)
    time.sleep(0.5)

    # Menu popover hiện ra
    popover = driver.find_element(By.CSS_SELECTOR, "[data-testid='popover-insert-block-menu']")
    assert popover.is_displayed(), "Menu chọn loại khối phải hiển thị khi bấm nút Chèn khối"

    # Chọn loại khối Sự kiện (EVENT)
    event_opt = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-popover-block-EVENT']")
    driver.execute_script("arguments[0].click();", event_opt)
    time.sleep(1)

    cards_after = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    assert len(cards_after) == count_before + 1, "Số khối phải tăng thêm 1 sau khi chèn từ Divider"

    # Khối đầu tiên (vị trí 0) phải là EVENT
    first_block = cards_after[0]
    assert first_block.get_attribute("data-block-type") == "EVENT", "Khối đầu tiên phải là EVENT vừa chèn"

def test_reorder_blocks_with_direction_buttons(driver):
    """Kiểm tra đổi thứ tự các khối bằng nút ▲ và ▼."""
    driver.get(LESSON_CREATE_URL)
    time.sleep(1.5)

    cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    assert len(cards) >= 2, "Cần ít nhất 2 khối để test sắp xếp"

    first_type_before = cards[0].get_attribute("data-block-type")
    second_type_before = cards[1].get_attribute("data-block-type")

    # Bấm nút ▼ ở khối đầu tiên để đưa xuống dưới
    move_down_btn = cards[0].find_element(By.CSS_SELECTOR, "[data-testid^='btn-move-down-']")
    driver.execute_script("arguments[0].click();", move_down_btn)
    time.sleep(1)

    cards_after = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    first_type_after = cards_after[0].get_attribute("data-block-type")
    second_type_after = cards_after[1].get_attribute("data-block-type")

    # Kiểm tra vị trí đã hoán đổi
    assert first_type_after == second_type_before, "Khối thứ hai cũ phải trở thành khối thứ nhất mới"
    assert second_type_after == first_type_before, "Khối thứ nhất cũ phải trở thành khối thứ hai mới"

def test_delete_block(driver):
    """Kiểm tra xóa khối thành công và cập nhật lại số lượng."""
    driver.get(LESSON_CREATE_URL)
    time.sleep(1.5)

    # Thêm 1 khối Nhân vật trước để có ít nhất 3 khối
    char_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-CHARACTER']")
    char_btn.click()
    time.sleep(0.8)

    cards_before = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    count_before = len(cards_before)

    # Chấp nhận window.confirm tự động bằng JS mock hoặc switch_to.alert
    driver.execute_script("window.confirm = function() { return true; };")

    # Bấm nút xóa khối cuối cùng
    del_btn = cards_before[-1].find_element(By.CSS_SELECTOR, "[data-testid^='btn-delete-block-']")
    driver.execute_script("arguments[0].click();", del_btn)
    time.sleep(1)

    cards_after = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='block-card-wrapper-']")
    assert len(cards_after) == count_before - 1, "Số lượng khối phải giảm đi 1 sau khi xóa"
