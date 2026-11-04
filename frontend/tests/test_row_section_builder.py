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

def test_insert_section_row_block_and_default_columns(driver):
    """Kiểm tra chèn khối Hàng nhiều cột (SECTION_ROW) từ Palette và khởi tạo mặc định 2 cột."""
    driver.get(LESSON_CREATE_URL)
    wait = WebDriverWait(driver, 10)
    
    # 1. Chờ Canvas hiển thị
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='block-builder-canvas']")))
    time.sleep(1)

    # 2. Bấm nút Hàng nhiều cột trên palette bên trái
    btn_section_row = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='btn-block-SECTION_ROW']")))
    driver.execute_script("arguments[0].click();", btn_section_row)
    time.sleep(1)

    # 3. Xác nhận có khối mới kiểu SECTION_ROW
    row_block = driver.find_element(By.CSS_SELECTOR, "[data-block-type='SECTION_ROW']")
    assert row_block.is_displayed(), "Khối Hàng nhiều cột phải xuất hiện trên Canvas"

    # 4. Xác nhận mặc định có 2 container cột
    col_0 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='column-container-0']")
    col_1 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='column-container-1']")
    assert col_0.is_displayed(), "Cột 1 phải hiển thị"
    assert col_1.is_displayed(), "Cột 2 phải hiển thị"

def test_switch_row_column_count(driver):
    """Kiểm tra chuyển đổi số lượng cột giữa 1, 2, 3 cột linh hoạt."""
    row_block = driver.find_element(By.CSS_SELECTOR, "[data-block-type='SECTION_ROW']")

    # 1. Chuyển sang 3 cột
    btn_col_3 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='btn-col-count-3']")
    driver.execute_script("arguments[0].click();", btn_col_3)
    time.sleep(0.5)

    columns = row_block.find_elements(By.CSS_SELECTOR, "[data-testid^='column-container-']")
    assert len(columns) == 3, f"Số cột phải là 3 sau khi chọn 3 cột, thực tế: {len(columns)}"

    # 2. Chuyển sang 1 cột
    btn_col_1 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='btn-col-count-1']")
    driver.execute_script("arguments[0].click();", btn_col_1)
    time.sleep(0.5)

    columns_1 = row_block.find_elements(By.CSS_SELECTOR, "[data-testid^='column-container-']")
    assert len(columns_1) == 1, f"Số cột phải là 1 sau khi chọn 1 cột, thực tế: {len(columns_1)}"

    # 3. Trở lại 2 cột
    btn_col_2 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='btn-col-count-2']")
    driver.execute_script("arguments[0].click();", btn_col_2)
    time.sleep(0.5)

    columns_2 = row_block.find_elements(By.CSS_SELECTOR, "[data-testid^='column-container-']")
    assert len(columns_2) == 2, f"Số cột phải là 2 sau khi chọn 2 cột, thực tế: {len(columns_2)}"

def test_apply_ratio_preset(driver):
    """Kiểm tra áp dụng tỷ lệ nhanh Preset (70:30, 50:50)."""
    row_block = driver.find_element(By.CSS_SELECTOR, "[data-block-type='SECTION_ROW']")
    grid_container = row_block.find_element(By.CSS_SELECTOR, "[data-testid='row-columns-grid']")

    # 1. Chọn preset 70-30
    btn_70_30 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='btn-preset-ratio-70-30']")
    driver.execute_script("arguments[0].click();", btn_70_30)
    time.sleep(0.5)

    style_attr = grid_container.get_attribute("style")
    assert "70%" in style_attr and "30%" in style_attr, f"Style phải chứa tỷ lệ 70% 30%, thực tế: {style_attr}"

    # 2. Chọn lại preset 50-50
    btn_50_50 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='btn-preset-ratio-50-50']")
    driver.execute_script("arguments[0].click();", btn_50_50)
    time.sleep(0.5)

    style_attr_50 = grid_container.get_attribute("style")
    assert "50%" in style_attr_50, f"Style phải chứa tỷ lệ 50%, thực tế: {style_attr_50}"

def test_column_resizer_handle_present_in_two_columns(driver):
    """Kiểm tra thanh kéo Resizer Handle hiển thị giữa 2 cột để hỗ trợ kéo chuột trực quan."""
    row_block = driver.find_element(By.CSS_SELECTOR, "[data-block-type='SECTION_ROW']")
    resizer = row_block.find_element(By.CSS_SELECTOR, "[data-testid='column-resizer-handle']")
    assert resizer.is_displayed(), "Thanh kéo resizer giữa 2 cột phải hiển thị"

def test_insert_block_into_column(driver):
    """Kiểm tra chèn một khối mới vào cột cụ thể bên trong Hàng."""
    row_block = driver.find_element(By.CSS_SELECTOR, "[data-block-type='SECTION_ROW']")

    # Mở popover chèn khối vào Cột 2
    btn_add_col_1 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='btn-add-block-to-col-1']")
    driver.execute_script("arguments[0].click();", btn_add_col_1)
    time.sleep(0.5)

    # Chọn chèn khối Sự kiện (EVENT) vào Cột 2
    popover = row_block.find_element(By.CSS_SELECTOR, "[data-testid='popover-picker-col-1']")
    assert popover.is_displayed(), "Popover chọn khối cho Cột 2 phải hiển thị"

    btn_event = popover.find_element(By.CSS_SELECTOR, "[data-testid='btn-col-insert-EVENT']")
    driver.execute_script("arguments[0].click();", btn_event)
    time.sleep(0.8)

    # Xác nhận Cột 2 có khối Event
    col_1 = row_block.find_element(By.CSS_SELECTOR, "[data-testid='column-container-1']")
    event_block = col_1.find_element(By.CSS_SELECTOR, "[data-testid='event-block-item-editor']")
    assert event_block.is_displayed(), "Khối Sự kiện phải hiển thị bên trong Cột 2"
