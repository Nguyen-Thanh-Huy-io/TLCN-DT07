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
    print("[TEST] Bat dau kiem thu tu dong HISGO Studio...")
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
        # 1. Mở trang HISGO Studio (/curriculum)
        print("[TEST] 1. Mo trang http://localhost:3000/curriculum")
        driver.get("http://localhost:3000/curriculum")

        # Chờ container Studio xuất hiện
        studio_container = wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "hisgo-studio-container"))
        )
        assert studio_container is not None, "Khong tim thay .hisgo-studio-container"
        print("  -> Da tai thanh cong HISGO Studio container.")

        # 2. Kiểm tra Header & Title
        title_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'H I S G O') and contains(text(), 'Studio')]")
        assert title_elem is not None, "Khong tim thay tieu de H I S G O Studio"
        print("  -> Tieu de studio: OK")

        # 3. Kiểm tra Tabs
        tab_chapters = driver.find_element(By.ID, "tab-curriculum-chapters")
        tab_library = driver.find_element(By.ID, "tab-lesson-library")
        assert tab_chapters is not None and tab_library is not None, "Khong tim thay 2 Tabs chinh"
        print("  -> Da tim thay Tab 'Chuong & nhom' va Tab 'Thu vien Lesson'")

        # Chờ dữ liệu lộ trình tải xong (có dropdown select-learning-path)
        path_select = wait.until(
            EC.presence_of_element_located((By.ID, "select-learning-path"))
        )
        time.sleep(1) # Đợi react render dữ liệu xong

        # Kiểm tra danh sách lộ trình
        options = path_select.find_elements(By.TAG_NAME, "option")
        print(f"  -> So lo trinh trong he thong: {len(options)}")
        for opt in options:
            if "Kháng chiến" in opt.text:
                opt.click()
                time.sleep(1)
                break

        # 4. Kiểm tra Cấu trúc chương
        chapter_headings = driver.find_elements(By.XPATH, "//*[contains(text(), 'Chương ') and contains(@class, 'font-bold')]")
        print(f"  -> Tim thay {len(chapter_headings)} chuong trong lo trinh duoc chon.")
        assert len(chapter_headings) > 0, "Lo trinh phai co it nhat 1 chuong!"

        # Chụp màn hình Tab 1 (Chương & nhóm)
        screenshot_chapters_path = os.path.join(artifact_dir, "hisgo_studio_chapters_view.png")
        driver.save_screenshot(screenshot_chapters_path)
        print(f"  -> Da chup anh man hinh Cau truc chuong: {screenshot_chapters_path}")

        # 5. Kiểm tra mở Modal "Thêm Lesson từ thư viện vào chương"
        add_lesson_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Thêm Lesson từ thư viện')]")
        if len(add_lesson_btns) > 0:
            print("  -> Nhan nut '+ Them Lesson tu thu vien' o chuong dau tien...")
            add_lesson_btns[0].click()
            time.sleep(1)

            # Kiểm tra modal xuất hiện
            modal_heading = wait.until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Thêm Lesson từ thư viện vào chương')]"))
            )
            assert modal_heading is not None, "Modal gom bai khong xuat hien"
            print("  -> Modal gom bai vao chuong da hien thi chinh xac.")

            # Chụp ảnh Modal
            screenshot_modal_path = os.path.join(artifact_dir, "hisgo_studio_modal_add_lessons.png")
            driver.save_screenshot(screenshot_modal_path)
            print(f"  -> Da chup anh man hinh Modal gom bai: {screenshot_modal_path}")

            # Đóng modal (click nút Hủy)
            cancel_btn = driver.find_element(By.XPATH, "//button[text()='Hủy']")
            cancel_btn.click()
            time.sleep(0.5)

        # 6. Chuyển sang Tab "Thư viện Lesson"
        print("[TEST] 2. Chuyen sang Tab 'Thu vien Lesson'...")
        tab_library.click()
        time.sleep(1)

        # Kiểm tra tiêu đề Thư viện Lesson
        lib_heading = wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Thư viện Lesson độc lập')]"))
        )
        assert lib_heading is not None, "Khong tim thay Thu vien Lesson doc lap"
        print("  -> Da mo Thu vien Lesson doc lap.")

        # Chụp ảnh Tab Thư viện
        screenshot_lib_path = os.path.join(artifact_dir, "hisgo_studio_library_view.png")
        driver.save_screenshot(screenshot_lib_path)
        print(f"  -> Da chup anh man hinh Thu vien Lesson: {screenshot_lib_path}")

        # 7. Kiểm tra Banner "2. Quy trình người tạo nội dung nên sử dụng" (4 bước)
        workflow_banner = driver.find_element(By.XPATH, "//*[contains(text(), '2. Quy trình người tạo nội dung nên sử dụng')]")
        assert workflow_banner is not None, "Khong tim thay banner quy trinh 4 buoc"
        step_1 = driver.find_element(By.XPATH, "//*[contains(text(), 'Bước 1')]")
        step_2 = driver.find_element(By.XPATH, "//*[contains(text(), 'Bước 2')]")
        step_3 = driver.find_element(By.XPATH, "//*[contains(text(), 'Bước 3')]")
        step_4 = driver.find_element(By.XPATH, "//*[contains(text(), 'Bước 4')]")
        assert all([step_1, step_2, step_3, step_4]), "Banner thieu mot trong 4 buoc"
        print("  -> Day du 4 buoc quy trinh bien soan noi dung.")

        print("\n[SUCCESS] TOAN BO KIEM THU TU DONG HISGO STUDIO DA DAT 100%!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
