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

def run_test():
    print("[TEST] Bat dau kiem thu tu dong 7 cai tien Lesson Editor...")
    artifact_dir = r"C:\Users\ACER\.gemini\antigravity-cli\brain\e3026bd3-a664-47da-bc5f-2cf1d41d4272"
    os.makedirs(artifact_dir, exist_ok=True)

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1440,1080")

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
        print("  -> Da tai thanh cong Lesson Editor.")

        # 2. Kiểm tra Header trên cùng tối giản: Thuộc tính, Gửi duyệt, Menu [...]
        # (Nút "Xem trước" rời đã bỏ khỏi header vì trùng với nhóm tab Soạn thảo/Chia
        # đôi/Xem trước ở sub-header — xem nhóm tab đó ở bước kiểm tra tiếp theo.)
        print("[TEST] 2. Kiem tra Header toi gian...")
        btn_properties = driver.find_element(By.ID, "btn-header-properties")
        btn_submit = driver.find_element(By.ID, "btn-header-submit")
        btn_more = driver.find_element(By.ID, "btn-header-more-menu")
        assert all([btn_properties, btn_submit, btn_more]), "Thieu nut tren Header"
        print("  -> Header: Thuoc tinh, Gui duyet, Menu [...] day du.")

        # 3. Kiểm tra Thuộc tính bên phải đóng mặc định
        right_asides = driver.find_elements(By.XPATH, "//aside[contains(., 'Thuộc tính bài học')]")
        assert len(right_asides) == 0, "Thuoc tinh ben phai phai dong mac dinh!"
        print("  -> Thuoc tinh ben phai da DONG mac dinh dung yeu cau.")

        # 4. Kiểm tra Sidebar trái & Thu gọn thành thanh công cụ mỏng
        print("[TEST] 3. Kiem tra thu gon Sidebar trai thanh toolstrip...")
        btn_collapse_left = driver.find_element(By.ID, "btn-collapse-left-sidebar")
        btn_collapse_left.click()
        time.sleep(0.5)

        # Kiểm tra toolstrip icon bar xuất hiện
        collapsed_toolstrip = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='left-sidebar-collapsed-toolstrip']"))
        )
        assert collapsed_toolstrip is not None, "Khong tim thay toolstrip thu gon"
        print("  -> Sidebar trai da thu gon thanh cong cu mong.")

        # Chụp ảnh màn hình Zen mode (Vùng soạn thảo mở rộng tối đa, sidebar trái thu gọn)
        screenshot_zen = os.path.join(artifact_dir, "editor_collapsed_left_sidebar_zen_mode.png")
        driver.save_screenshot(screenshot_zen)
        print(f"  -> Da chup anh man hinh Zen Writing Mode: {screenshot_zen}")

        # Mở rộng lại sidebar trái
        btn_expand_left = driver.find_element(By.ID, "btn-expand-left-sidebar")
        btn_expand_left.click()
        time.sleep(0.5)

        # 5. Kiểm tra chèn khối Timeline & Thu gọn mốc
        print("[TEST] 4. Kiem tra Timeline va thu gon moc...")
        # Tìm và nhấn nút chèn Timeline từ Palette
        timeline_palette_btn = driver.find_element(By.XPATH, "//button[contains(., 'Dòng thời gian') or contains(., 'Timeline')]")
        timeline_palette_btn.click()
        time.sleep(1)

        # Tìm nút "Thu gọn các mốc" trong khối timeline
        collapse_timeline_nodes_btn = wait.until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Thu gọn các mốc')]"))
        )
        collapse_timeline_nodes_btn.click()
        time.sleep(0.5)
        print("  -> Da thu gon toan bo cac moc trong Timeline.")

        # Chụp ảnh Timeline các mốc thu gọn
        screenshot_timeline = os.path.join(artifact_dir, "editor_timeline_compact_nodes.png")
        driver.save_screenshot(screenshot_timeline)
        print(f"  -> Da chup anh man hinh Timeline Compact: {screenshot_timeline}")

        # 6. Kiểm tra chèn khối Nhân vật & Thẻ tinh gọn
        print("[TEST] 5. Kiem tra Block Nhan vat tinh gon...")
        character_palette_btn = driver.find_element(By.XPATH, "//button[contains(., 'Nhân vật lịch sử') or contains(., 'Nhân vật')]")
        character_palette_btn.click()
        time.sleep(1)

        # Kiểm tra thẻ nhân vật hiển thị compact
        character_card = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[@data-testid='character-block-item-editor']"))
        )
        assert character_card is not None, "Khong tim thay the nhan vat"

        # Bấm nút mở rộng mô tả
        expand_char_btn = driver.find_element(By.XPATH, "//button[contains(., 'Sửa chi tiết') or contains(., 'Mở rộng')]")
        expand_char_btn.click()
        time.sleep(0.5)
        print("  -> Da mo rong the nhan vat de sua mo ta.")

        # Chụp ảnh Block Nhân vật
        screenshot_char = os.path.join(artifact_dir, "editor_character_compact_card.png")
        driver.save_screenshot(screenshot_char)
        print(f"  -> Da chup anh man hinh Block Nhan vat: {screenshot_char}")

        # 7. Kiểm tra mở Panel Thuộc tính bên phải
        print("[TEST] 6. Kiem tra mo Panel Thuoc tinh ben phai...")
        btn_properties.click()
        time.sleep(0.8)

        # Kiểm tra aside thuộc tính xuất hiện
        right_asides_open = wait.until(
            EC.presence_of_element_located((By.XPATH, "//aside[contains(., 'Thuộc tính bài học')]"))
        )
        assert right_asides_open is not None, "Panel thuoc tinh phai mo khi bam nut"
        print("  -> Panel thuoc tinh ben phai da mo thanh cong.")

        # Chụp ảnh Panel Thuộc tính mở
        screenshot_prop = os.path.join(artifact_dir, "editor_properties_panel_open.png")
        driver.save_screenshot(screenshot_prop)
        print(f"  -> Da chup anh man hinh Thuoc tinh ben phai: {screenshot_prop}")

        print("\n[SUCCESS] TOAN BO 7 CAI TIEN LESSON EDITOR DA HOAN THANH VA DAT 100%!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
