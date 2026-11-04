import os
import sys
import time

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def log(msg):
    print(msg, flush=True)

def run_test():
    log("[TEST] Bat dau kiem thu tu dong Tich hop Wikipedia API trong Lesson Editor...")
    artifact_dir = r"C:\Users\ACER\.gemini\antigravity-cli\brain\e3026bd3-a664-47da-bc5f-2cf1d41d4272"
    os.makedirs(artifact_dir, exist_ok=True)

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1440,1080")
    chrome_options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 15)

    try:
        # 1. Mở trang Soạn thảo bài học (/lessons/create)
        log("[TEST] 1. Mo trang http://localhost:3000/lessons/create")
        driver.get("http://localhost:3000/lessons/create")

        # Chờ container Editor xuất hiện
        editor_wrap = wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "editor-wrap"))
        )
        assert editor_wrap is not None, "Khong tim thay .editor-wrap"
        log("  -> Da tai trang Soan thao bai hoc thanh cong.")

        # 2. Chèn khối Nhân vật
        log("[TEST] 2. Chen khoi Nhan vat...")
        char_palette_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nhân vật lịch sử') or contains(., 'Nhân vật')]"))
        )
        char_palette_btn.click()
        time.sleep(1)

        # 3. Mở EntityPickerModal
        log("[TEST] 3. Mo EntityPickerModal tu the Nhan vat...")
        pick_btn = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='btn-pick-character']"))
        )
        driver.execute_script("arguments[0].click();", pick_btn)
        time.sleep(1)

        picker_modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='modal-entity-picker']"))
        )
        assert picker_modal is not None, "Khong mo duoc EntityPickerModal"
        log("  -> EntityPickerModal da mo thanh cong.")

        # 4. Kiểm tra Tab Wikipedia và chuyển tab
        log("[TEST] 4. Kiem tra va chuyen sang tab Wikipedia tieng Viet...")
        wiki_tab_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//*[@data-testid='tab-source-wikipedia']"))
        )
        wiki_tab_btn.click()
        time.sleep(0.5)
        log("  -> Da chuyen sang tab Wikipedia tieng Viet.")

        # 5. Tìm kiếm từ khóa "Võ Nguyên Giáp"
        log("[TEST] 5. Nhap tu khoa 'Võ Nguyên Giáp' vao o tim kiem...")
        search_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='input-search-entity']"))
        )
        search_input.clear()
        search_input.send_keys("Võ Nguyên Giáp")
        log("  -> Dang cho phan hoi tu Wikipedia REST API...")
        time.sleep(2.5)

        # 6. Kiểm tra kết quả tìm kiếm từ Wikipedia
        log("[TEST] 6. Kiem tra danh sach ket qua Wikipedia...")
        first_result = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(@data-testid, 'entity-picker-item-')]"))
        )
        log(f"  -> Ket qua Wikipedia dau tien: {first_result.text[:60]}...")
        assert "Võ Nguyên Giáp" in first_result.text, "Ket qua Wikipedia khong dung tu khoa tim kiem"

        # 7. Kiểm tra bảng xem trước (Preview Panel) bên phải
        log("[TEST] 7. Kiem tra bang xem truoc & boc tach du lieu tu dong...")
        time.sleep(1)
        preview_name = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='input-preview-name']"))
        )
        name_val = preview_name.get_attribute("value")
        log(f"  -> Ten boc tach: {name_val}")
        assert "Võ Nguyên Giáp" in name_val, "Ten boc tach khong trung khop"

        preview_years = driver.find_element(By.XPATH, "//*[@data-testid='input-preview-years']")
        years_val = preview_years.get_attribute("value")
        log(f"  -> Nam boc tach tu Regex: '{years_val}'")
        assert "1911" in years_val, f"Nam sinh boc tach phai chua 1911 (nhan duoc: {years_val})"

        preview_summary = driver.find_element(By.XPATH, "//*[@data-testid='textarea-preview-summary']")
        summary_val = preview_summary.get_attribute("value")
        log(f"  -> Do dai tieu su trich xuat: {len(summary_val)} ky tu (<= 500 ky tu)")
        assert len(summary_val) > 20, "Tieu su trich xuat bi trong"
        assert len(summary_val) <= 500, "Tieu su vuot qua gioi han 500 ky tu"

        # Chụp ảnh Modal Wikipedia với Preview dữ liệu
        screenshot_preview = os.path.join(artifact_dir, "screenshot_wikipedia_picker_preview.png")
        driver.save_screenshot(screenshot_preview)
        log(f"  -> Da chup anh Modal Wikipedia Preview: {screenshot_preview}")

        # 8. Bấm nút "Nhập nhanh vào bài học"
        log("[TEST] 8. Bam nut 'Nhap nhanh vao bai hoc'...")
        apply_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//*[@data-testid='btn-apply-wiki-entity']"))
        )
        apply_btn.click()
        time.sleep(1)

        # 9. Kiểm tra khối Nhân vật trên bài học đã được cập nhật dữ liệu từ Wikipedia
        log("[TEST] 9. Kiem tra the Nhan vat tren Canvas sau khi nhap...")
        char_name_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='input-character-name']"))
        )
        actual_name = char_name_input.get_attribute("value")
        log(f"  -> Ten nhan vat tren Canvas: {actual_name}")
        assert "Võ Nguyên Giáp" in actual_name, "Du lieu ten chua duoc dong bo vao Canvas"

        char_years_input = driver.find_element(By.XPATH, "//*[@data-testid='input-character-years']")
        actual_years = char_years_input.get_attribute("value")
        log(f"  -> Nam sinh/mat tren Canvas: {actual_years}")
        assert "1911" in actual_years, "Du lieu nam chua duoc dong bo vao Canvas"

        # Mở rộng thẻ nhân vật để kiểm tra tóm tắt đã được điền
        expand_char_btn = driver.find_element(By.XPATH, "//button[contains(., 'Sửa chi tiết') or contains(., 'Mở rộng')]")
        expand_char_btn.click()
        time.sleep(0.5)

        summary_textarea = driver.find_element(By.XPATH, "//*[@data-testid='input-character-summary']")
        actual_summary = summary_textarea.get_attribute("value")
        log(f"  -> Tieu su tren Canvas ({len(actual_summary)} ky tu): {actual_summary[:70]}...")
        assert len(actual_summary) > 20, "Tieu su chua duoc dong bo vao the Nhan vat"

        # Chụp ảnh khối Nhân vật hoàn chỉnh sau khi import từ Wikipedia
        screenshot_card = os.path.join(artifact_dir, "screenshot_character_card_after_wiki_import.png")
        driver.save_screenshot(screenshot_card)
        log(f"  -> Da chup anh the Nhan vat tren Canvas: {screenshot_card}")

        log("\n[SUCCESS] TOAN BO KIEM THU TICH HOP WIKIPEDIA API DA HOAN THANH VA DAT 100%!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
