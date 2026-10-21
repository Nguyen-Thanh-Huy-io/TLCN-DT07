import time
import os
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

LESSON_CREATE_URL = "http://localhost:3000/lessons/create"
ARTIFACT_DIR = r"C:\Users\ACER\.gemini\antigravity-cli\brain\e3026bd3-a664-47da-bc5f-2cf1d41d4272"

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

def test_chapter_sidebar_display_and_labels(driver):
    """Kiem tra nhan Chuong hoc (Chapter) va thu tu bai hoc hien thi dung tren Sidebar."""
    driver.get(LESSON_CREATE_URL)
    wait = WebDriverWait(driver, 15)

    # Doi Sidebar chapter field xuat hien
    chapter_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='sidebar-chapter-field']")))
    assert chapter_field.is_displayed(), "Sidebar chapter field phai hien thi"

    # Kiem tra nhan chua 'chuong hoc (chapter)' (case-insensitive do co the bi uppercase boi CSS)
    field_text = chapter_field.text.lower()
    assert "chương học (chapter)" in field_text, f"Nhan phai chua 'chương học (chapter)', nhan duoc: {field_text}"

    # Doi selected-chapter-display xuat hien
    chapter_display = driver.find_element(By.CSS_SELECTOR, "[data-testid='selected-chapter-display']")
    assert chapter_display.is_displayed(), "selected-chapter-display phai hien thi"

    # Kiem tra muc Thu tu bai hoc co mat trong sidebar
    sidebar_container = driver.find_element(By.CSS_SELECTOR, "[data-testid='sidebar-chapter-field']").find_element(By.XPATH, "../..")
    sidebar_text = sidebar_container.text.lower()
    assert "thứ tự bài học" in sidebar_text, "Phai co muc 'Thu tu bai hoc' tren sidebar"

def test_change_chapter_modal_interaction(driver):
    """Kiem tra mo modal chon Chuong hoc (Chapter), doi chuong va cap nhat hien thi tuc thi."""
    driver.get(LESSON_CREATE_URL)
    wait = WebDriverWait(driver, 15)

    # 1. Bam nut Doi chuong hoc
    btn_change = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='btn-change-chapter']")))
    driver.execute_script("arguments[0].click();", btn_change)
    time.sleep(1)

    # 2. Modal xuat hien voi tieu de chuan
    modal = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='chapter-picker-modal']")))
    assert modal.is_displayed(), "Modal chon chuong hoc phai hien thi"

    modal_header = modal.find_element(By.TAG_NAME, "h2").text.lower()
    assert "chương học (chapter)" in modal_header, f"Tieu de modal phai chua 'chương học (chapter)', nhan duoc: {modal_header}"

    # 3. Tim cac chapter items trong danh sach cay
    items = modal.find_elements(By.CSS_SELECTOR, "[data-testid='chapter-item-row']")
    assert len(items) > 0, "Modal phai co danh sach cac chuong hoc"

    # Chon mot chuong hoc
    target_item = items[0]
    driver.execute_script("arguments[0].click();", target_item)
    time.sleep(0.5)

    # 4. Xac nhan chon vi tri
    btn_confirm = modal.find_element(By.CSS_SELECTOR, "[data-testid='btn-confirm-chapter-picker']")
    assert btn_confirm.is_enabled(), "Nut xac nhan phai duoc kich hoat sau khi chon chuong"
    driver.execute_script("arguments[0].click();", btn_confirm)
    time.sleep(1)

    # 5. Xac nhan ten chuong hoc hien thi o Sidebar khong rong
    chapter_display = driver.find_element(By.CSS_SELECTOR, "[data-testid='selected-chapter-display']")
    new_selected_name = chapter_display.text.strip()
    assert new_selected_name != "" and "Chưa gắn" not in new_selected_name, f"Ten chuong hoc phai hop le, nhan duoc: {new_selected_name}"

    # Chup anh minh chung luu vao Artifacts
    screenshot_path = os.path.join(ARTIFACT_DIR, "screenshot_chapter_grouping.png")
    driver.save_screenshot(screenshot_path)
