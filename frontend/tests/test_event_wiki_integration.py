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
    log("[TEST] Bat dau kiem thu tu dong Tich hop Bo 3 Wikimedia vao Khoi SU KIEN (Event Block)...")
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

        # 2. Chèn khối Sự kiện
        log("[TEST] 2. Chen khoi Su kien tu sidebar...")
        event_palette_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sự kiện') or contains(., 'Sự kiện lịch sử')]"))
        )
        event_palette_btn.click()
        time.sleep(1)

        # 3. Mở EventPickerModal
        log("[TEST] 3. Mo EventPickerModal tu the Su kien...")
        pick_btn = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='btn-pick-event']"))
        )
        driver.execute_script("arguments[0].click();", pick_btn)
        time.sleep(1)

        picker_modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='modal-event-picker']"))
        )
        assert picker_modal is not None, "Khong mo duoc EventPickerModal"
        log("  -> EventPickerModal da mo thanh cong.")

        # 4. Kiểm tra Tab Wikipedia và chuyển tab
        log("[TEST] 4. Kiem tra va chuyen sang tab Wikipedia & Wikidata...")
        wiki_tab_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//*[@data-testid='tab-event-source-wikipedia']"))
        )
        wiki_tab_btn.click()
        time.sleep(0.5)
        log("  -> Da chuyen sang tab Wikipedia & Wikidata.")

        # 5. Tìm kiếm từ khóa "Chiến dịch Điện Biên Phủ"
        log("[TEST] 5. Nhap tu khoa 'Chiến dịch Điện Biên Phủ' vao o tim kiem...")
        search_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='input-search-event']"))
        )
        search_input.clear()
        search_input.send_keys("Chiến dịch Điện Biên Phủ")
        log("  -> Dang cho phan hoi tu Wikipedia, Wikidata va Wikimedia Commons...")
        time.sleep(3)

        # 6. Kiểm tra kết quả tìm kiếm
        log("[TEST] 6. Kiem tra danh sach ket qua su kien...")
        first_result = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(@data-testid, 'event-picker-item-')]"))
        )
        log(f"  -> Ket qua dau tien: {first_result.text[:60]}...")
        assert "Chiến dịch Điện Biên Phủ" in first_result.text, "Ket qua khong dung tu khoa tim kiem"

        # 7. Kiểm tra dữ liệu có cấu trúc Wikidata (P580, P582, QID) trên bảng Preview
        log("[TEST] 7. Kiem tra bang xem truoc & du lieu thoi gian Wikidata (P580/P582)...")
        time.sleep(1)
        
        # Kiểm tra badge Wikidata QID
        wikidata_badge = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='badge-event-wikidata-id']"))
        )
        log(f"  -> Badge Wikidata: {wikidata_badge.text}")
        assert "Q604897" in wikidata_badge.text, f"Khong tim thay ma Wikidata Q604897 (nhan duoc: {wikidata_badge.text})"

        # Kiểm tra ô thời gian/địa điểm từ Wikidata
        preview_time = driver.find_element(By.XPATH, "//*[@data-testid='input-preview-event-timeloc']")
        time_val = preview_time.get_attribute("value")
        log(f"  -> Thoi gian su kien tu Wikidata Claims (P580 - P582): '{time_val}'")
        assert "13/03/1954" in time_val, f"Ngay bat dau phai la 13/03/1954 (nhan duoc: {time_val})"
        assert "07/05/1954" in time_val, f"Ngay ket thuc phai la 07/05/1954 (nhan duoc: {time_val})"

        # Chụp ảnh Modal với đầy đủ Metadata Wikidata sự kiện
        screenshot_preview = os.path.join(artifact_dir, "screenshot_event_wiki_preview.png")
        driver.save_screenshot(screenshot_preview)
        log(f"  -> Da chup anh Modal Event Wiki Preview: {screenshot_preview}")

        # 8. Bấm nút "Nhập nhanh vào sự kiện"
        log("[TEST] 8. Bam nut 'Nhap nhanh vao su kien'...")
        apply_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//*[@data-testid='btn-apply-wiki-event']"))
        )
        apply_btn.click()
        time.sleep(1)

        # 9. Kiểm tra khối Sự kiện trên bài học đã có badge Wikidata, ngày tháng và tóm tắt chuẩn
        log("[TEST] 9. Kiem tra the Su kien tren Canvas sau khi nhap...")
        event_name_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='input-event-name']"))
        )
        actual_name = event_name_input.get_attribute("value")
        log(f"  -> Ten su kien tren Canvas: {actual_name}")
        assert "Chiến dịch Điện Biên Phủ" in actual_name, "Du lieu ten su kien chua duoc dong bo vao Canvas"

        event_timeloc_input = driver.find_element(By.XPATH, "//*[@data-testid='input-event-timeloc']")
        actual_timeloc = event_timeloc_input.get_attribute("value")
        log(f"  -> Thoi gian/dia diem tren Canvas: '{actual_timeloc}'")
        assert "13/03/1954 – 07/05/1954" in actual_timeloc, "Thoi gian su kien Wikidata chua duoc dong bo"

        # Kiểm tra badge Wikidata trên thẻ sự kiện
        event_wd_badge = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='badge-event-wikidata']"))
        )
        log(f"  -> Badge Wikidata tren the su kien: {event_wd_badge.text}")
        assert "Q604897" in event_wd_badge.text, "Badge Wikidata chua xuat hien tren the su kien"

        # Kiểm tra giới hạn ký tự tóm tắt hiển thị tối đa 500
        event_summary_counter = driver.find_element(By.XPATH, "//*[contains(text(), '/500 ký tự')]")
        log(f"  -> Bo dem ky tu tom tat su kien: {event_summary_counter.text}")
        assert "/500 ký tự" in event_summary_counter.text, "Gioi han ky tu phai la 500 ky tu"

        # Chụp ảnh khối Sự kiện hoàn chỉnh trên Canvas
        screenshot_card = os.path.join(artifact_dir, "screenshot_event_card_after_wiki_import.png")
        driver.save_screenshot(screenshot_card)
        log(f"  -> Da chup anh the Su kien tren Canvas: {screenshot_card}")

        log("\n[SUCCESS] TOAN BO KIEM THU TICH HOP WIKIMEDIA CHO KHOI SU KIEN DA HOAN THANH VA DAT 100%!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
