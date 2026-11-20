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
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

def run_test():
    print("[TEST] Bat dau kiem thu tu dong Dropdown Chieu rong, Entity Picker Modal & Text Modal...")
    artifact_dir = r"C:\Users\ACER\.gemini\antigravity-cli\brain\e3026bd3-a664-47da-bc5f-2cf1d41d4272"
    os.makedirs(artifact_dir, exist_ok=True)

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1440,1080")
    # Bật logging browser console để bắt lỗi Axios
    chrome_options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 15)

    try:
        # 1. Mở trang Soạn thảo bài học (/lessons/create)
        print("[TEST] 1. Mo trang http://localhost:3000/lessons/create")
        driver.get("http://localhost:3000/lessons/create")

        # Chờ container Editor xuất hiện
        editor_wrap = wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "editor-wrap"))
        )
        assert editor_wrap is not None, "Khong tim thay .editor-wrap"
        print("  -> Da tai Lesson Editor.")

        # 2. Chèn khối Nhân vật (để kiểm tra cả Dropdown chiều rộng 50%, 33%, 100% và Entity Picker)
        print("[TEST] 2. Chen khoi Nhan vat...")
        char_palette_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nhân vật lịch sử') or contains(., 'Nhân vật')]"))
        )
        char_palette_btn.click()
        time.sleep(1)

        # 3. Kiểm tra Dropdown chọn chiều rộng khối (Nhãn số % gọn gàng: 50%, 33%, 100%)
        print("[TEST] 3. Kiem tra Dropdown chon chieu rong khoi...")
        width_select = wait.until(
            EC.presence_of_element_located((By.XPATH, "//select[contains(@data-testid, 'select-width')]"))
        )
        select_elem = Select(width_select)
        options = [opt.text.strip() for opt in select_elem.options]
        print(f"  -> Cac tuy chon chieu rong trong Dropdown: {options}")
        assert len(options) >= 2, "Dropdown phai co it nhat 2 tuy chon chieu rong"

        # Đảm bảo nhãn hiển thị thuần số % theo đúng góp ý của người dùng
        for opt_text in options:
            assert "%" in opt_text or opt_text == "Auto", f"Option {opt_text} khong dung dinh dang %"
            assert "Hàng" not in opt_text, f"Option {opt_text} van con chu 'Hàng' thua thai"

        # Chọn 50% qua Dropdown
        select_elem.select_by_visible_text("50%")
        time.sleep(0.5)
        print("  -> Da chon ti le chieu rong '50%' qua Dropdown thanh cong.")

        # Chụp ảnh Dropdown chiều rộng tinh gọn
        screenshot_width = os.path.join(artifact_dir, "screenshot_dropdown_width_selector.png")
        driver.save_screenshot(screenshot_width)
        print(f"  -> Da chup anh Dropdown chieu rong: {screenshot_width}")

        # 4. Kiểm tra nút mở EntityPickerModal và xác minh không bị lỗi 404
        print("[TEST] 4. Kiem tra EntityPickerModal & API /historical-entities...")
        pick_btn = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='btn-pick-character']"))
        )
        driver.execute_script("arguments[0].click();", pick_btn)
        time.sleep(1.5)

        # Chờ modal xuất hiện
        picker_modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='modal-entity-picker']"))
        )
        assert picker_modal is not None, "Khong mo duoc EntityPickerModal"
        print("  -> EntityPickerModal da mo thanh cong.")

        # Chờ thêm 1 giây để request Axios API hoàn thành
        time.sleep(1.5)

        # Kiểm tra console logs không có 404
        logs = driver.get_log('browser')
        has_404_error = False
        for entry in logs:
            if "historical-entities" in entry.get("message", "") and "404" in entry.get("message", ""):
                has_404_error = True
                print(f"  [ERROR] Phat hien loi 404 trong console: {entry['message']}")

        assert not has_404_error, "Van con loi 404 khi goi API /historical-entities!"
        print("  -> Xac nhan API /historical-entities khong bi loi 404!")

        # Chụp ảnh Modal Entity Picker
        screenshot_picker = os.path.join(artifact_dir, "screenshot_entity_picker_modal.png")
        driver.save_screenshot(screenshot_picker)
        print(f"  -> Da chup anh EntityPickerModal: {screenshot_picker}")

        # Đóng modal picker
        close_picker_btn = picker_modal.find_element(By.XPATH, ".//button[contains(., '✕')]")
        close_picker_btn.click()
        time.sleep(0.5)

        # 5. Kiểm tra Thẻ Nhân vật & Giới hạn ký tự (Limit chữ)
        print("[TEST] 5. Kiem tra the Nhan vat & Gioi han ky tu...")
        expand_char_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sửa chi tiết') or contains(., 'Mở rộng')]"))
        )
        expand_char_btn.click()
        time.sleep(0.5)

        # Kiểm tra bộ đếm ký tự counter
        counter_elem = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='character-summary-counter']"))
        )
        assert "/500" in counter_elem.text, "Khong tim thay bo dem /500 ky tu"
        print(f"  -> Bo dem ky tu hien tai: {counter_elem.text}")

        # Nhập văn bản vào textarea tóm tắt
        summary_textarea = driver.find_element(By.XPATH, "//*[@data-testid='input-character-summary']")
        test_text = "Lãnh tụ vĩ đại của dân tộc Việt Nam."
        summary_textarea.send_keys(" - " + test_text)
        time.sleep(0.5)

        counter_after = driver.find_element(By.XPATH, "//*[@data-testid='character-summary-counter']")
        print(f"  -> Bo dem sau khi nhap: {counter_after.text}")
        assert "/500" in counter_after.text, "Bo dem ky tu phai co dinh dang /500 ky tu"

        # Chụp ảnh bộ đếm giới hạn chữ
        screenshot_char_limit = os.path.join(artifact_dir, "screenshot_character_limit_counter.png")
        driver.save_screenshot(screenshot_char_limit)
        print(f"  -> Da chup anh Gioi han chu Nhan vat: {screenshot_char_limit}")

        # 6. Kiểm tra Khối Văn bản & Mở Modal soạn thảo tập trung
        print("[TEST] 6. Kiem tra nut Mo Modal soan thao van ban...")
        btn_open_modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='btn-open-text-modal']"))
        )
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn_open_modal)
        time.sleep(0.5)
        driver.execute_script("arguments[0].click();", btn_open_modal)
        time.sleep(1)

        # Kiểm tra Modal mở ra
        zen_modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='text-block-zen-modal']"))
        )
        assert zen_modal is not None, "Modal soan thao van ban khong xuat hien"
        print("  -> Zen Focus Modal soan thao van ban da mo thanh cong.")

        # Chụp ảnh Modal soạn thảo lớn
        screenshot_text_modal = os.path.join(artifact_dir, "screenshot_text_editor_modal.png")
        driver.save_screenshot(screenshot_text_modal)
        print(f"  -> Da chup anh Modal soan thao van ban: {screenshot_text_modal}")

        # Đóng modal bằng nút Áp dụng
        btn_apply_modal = driver.find_element(By.ID, "btn-apply-text-modal")
        btn_apply_modal.click()
        time.sleep(0.5)
        print("  -> Da ap dung va dong modal ve Canvas.")

        print("\n[SUCCESS] TOAN BO CAC CAI TIEN VA SUA LOI 404 DA HOAN THANH VA DAT 100%!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
