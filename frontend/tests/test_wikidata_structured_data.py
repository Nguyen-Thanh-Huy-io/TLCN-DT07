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
    log("[TEST] Bat dau kiem thu tu dong Tich hop Du lieu co cau truc Wikidata & Commons trong HISGO...")
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
        log("  -> Dang cho phan hoi tu Bo 3 Wikimedia (Wikipedia + Wikidata + Commons)...")
        time.sleep(3)

        # 6. Kiểm tra kết quả tìm kiếm
        log("[TEST] 6. Kiem tra danh sach ket qua...")
        first_result = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(@data-testid, 'entity-picker-item-')]"))
        )
        log(f"  -> Ket qua dau tien: {first_result.text[:60]}...")
        assert "Võ Nguyên Giáp" in first_result.text, "Ket qua khong dung tu khoa tim kiem"

        # 7. Kiểm tra dữ liệu có cấu trúc Wikidata (P569, P570, QID) trên bảng Preview
        log("[TEST] 7. Kiem tra bang xem truoc & du lieu co cau truc tu Wikidata...")
        time.sleep(1)
        
        # Kiểm tra badge Wikidata QID
        wikidata_badge = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='badge-wikidata-id']"))
        )
        log(f"  -> Badge Wikidata: {wikidata_badge.text}")
        assert "Q179910" in wikidata_badge.text, f"Khong tim thay ma Wikidata Q179910 (nhan duoc: {wikidata_badge.text})"

        # Kiểm tra ô năm sinh - mất chính xác đến ngày tháng từ Wikidata P569 / P570
        preview_years = driver.find_element(By.XPATH, "//*[@data-testid='input-preview-years']")
        years_val = preview_years.get_attribute("value")
        log(f"  -> Ngay sinh/mat tu Wikidata Claims: '{years_val}'")
        assert "25/08/1911" in years_val, f"Ngay sinh phai chinh xac '25/08/1911' (nhan duoc: {years_val})"
        assert "04/10/2013" in years_val, f"Ngay mat phai chinh xac '04/10/2013' (nhan duoc: {years_val})"

        # Chụp ảnh Modal với đầy đủ Metadata Wikidata và Commons
        screenshot_preview = os.path.join(artifact_dir, "screenshot_wikidata_structured_preview.png")
        driver.save_screenshot(screenshot_preview)
        log(f"  -> Da chup anh Modal Wikidata Preview: {screenshot_preview}")

        # 8. Bấm nút "Nhập nhanh vào bài học"
        log("[TEST] 8. Bam nut 'Nhap nhanh vao bai hoc'...")
        apply_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//*[@data-testid='btn-apply-wiki-entity']"))
        )
        apply_btn.click()
        time.sleep(1)

        # 9. Kiểm tra khối Nhân vật trên bài học đã có badge Wikidata và ngày tháng chính xác
        log("[TEST] 9. Kiem tra the Nhan vat tren Canvas sau khi nhap...")
        char_name_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='input-character-name']"))
        )
        actual_name = char_name_input.get_attribute("value")
        log(f"  -> Ten nhan vat tren Canvas: {actual_name}")
        assert "Võ Nguyên Giáp" in actual_name, "Du lieu ten chua duoc dong bo vao Canvas"

        char_years_input = driver.find_element(By.XPATH, "//*[@data-testid='input-character-years']")
        actual_years = char_years_input.get_attribute("value")
        log(f"  -> Ngay sinh/mat tren Canvas: '{actual_years}'")
        assert "25/08/1911 – 04/10/2013" in actual_years, "Ngay thang Wikidata chua duoc dong bo vao Canvas"

        # Kiểm tra badge Wikidata trên thẻ nhân vật
        char_wd_badge = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='badge-character-wikidata']"))
        )
        log(f"  -> Badge Wikidata tren the: {char_wd_badge.text}")
        assert "Q179910" in char_wd_badge.text, "Badge Wikidata chua xuat hien tren the"

        # Chụp ảnh khối Nhân vật hoàn chỉnh với badge Wikidata và ngày sinh chuẩn
        screenshot_card = os.path.join(artifact_dir, "screenshot_character_card_with_wikidata_badge.png")
        driver.save_screenshot(screenshot_card)
        log(f"  -> Da chup anh the Nhan vat tren Canvas: {screenshot_card}")

        log("\n[SUCCESS] TOAN BO KIEM THU DU LIEU CO CAU TRUC WIKIDATA DA HOAN THANH VA DAT 100%!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
