import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000/thuc-the/le-loi"


@pytest.fixture(scope="module")
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    service = Service(ChromeDriverManager().install())
    web_driver = webdriver.Chrome(service=service, options=options)
    web_driver.implicitly_wait(10)
    yield web_driver
    web_driver.quit()


def test_note_taking_drawer_interaction(driver):
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 15)

    # 1. Chờ nút mở sổ ghi chú (NoteFloatingButton) xuất hiện trên màn hình
    note_btn = wait.until(
        EC.presence_of_element_located((By.XPATH, "//button[@title='Mở sổ ghi chú cá nhân']"))
    )
    assert note_btn is not None, "Nút mở sổ ghi chú không xuất hiện"
    driver.execute_script("arguments[0].click();", note_btn)
    time.sleep(1)

    # 2. Kiểm tra Drawer sổ ghi chú đã mở
    drawer_title = wait.until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Sổ Ghi Chú Cá Nhân')]"))
    )
    assert drawer_title is not None, "Tiêu đề Sổ Ghi Chú Cá Nhân không xuất hiện trong drawer"

    # 3. Nhập ghi chú mới vào textarea
    textarea = wait.until(
        EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='Nhập ghi chú, suy nghĩ hoặc kiến thức cần nhớ...']"))
    )
    test_note_text = "Ghi chú ôn tập tự động: Khởi nghĩa Lam Sơn đại thắng năm 1427."
    textarea.clear()
    textarea.send_keys(test_note_text)

    # 4. Bấm nút Lưu ghi chú
    save_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Lưu ghi chú')]")
    save_btn.click()
    time.sleep(2)

    # 5. Kiểm tra ghi chú đã hiển thị trong danh sách ghi chú của Drawer
    note_card = wait.until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{test_note_text}')]"))
    )
    assert note_card is not None, "Ghi chú vừa tạo không hiển thị trong danh sách ghi chú"

    # 6. Thao tác dọn dẹp (xoá ghi chú thử nghiệm)
    try:
        delete_btn = driver.find_element(By.XPATH, "//button[@title='Xoá ghi chú']")
        # Chấp nhận prompt confirm xoá
        driver.execute_script("window.confirm = function() { return true; };")
        driver.execute_script("arguments[0].click();", delete_btn)
        time.sleep(1)
    except Exception as e:
        print("Bỏ qua bước xoá nếu không click được:", e)
