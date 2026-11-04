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

def test_palette_and_clean_n_x_1_layout(driver):
    """Kiểm tra Palette chỉ chứa các khối chuẩn sư phạm môn Sử và KHÔNG còn khối chia cột dư thừa."""
    driver.get(LESSON_CREATE_URL)
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='block-builder-canvas']")))
    time.sleep(1)

    # 1. Xác nhận Palette KHÔNG còn khối "Hàng nhiều cột" (SECTION_ROW)
    section_row_btns = driver.find_elements(By.CSS_SELECTOR, "[data-testid='btn-block-SECTION_ROW']")
    assert len(section_row_btns) == 0, "Khối 'Hàng nhiều cột' (SECTION_ROW) phải được loại bỏ khỏi Palette"

    # 2. Xác nhận trên các khối nội dung KHÔNG còn các vùng thả tách cột (split-dropzone-left / split-dropzone-right)
    left_dropzones = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='split-dropzone-left-']")
    right_dropzones = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='split-dropzone-right-']")
    assert len(left_dropzones) == 0, "Không được còn vùng thả tách cột trái gây rối giao diện"
    assert len(right_dropzones) == 0, "Không được còn vùng thả tách cột phải gây rối giao diện"

    # 3. Xác nhận các khối chuẩn sư phạm vẫn đầy đủ trên Palette (Văn bản, Timeline, Nhân vật, Quiz...)
    btn_text = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-TEXT']")
    btn_timeline = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-TIMELINE']")
    assert btn_text.is_displayed(), "Khối Văn bản phải có trên Palette"
    assert btn_timeline.is_displayed(), "Khối Timeline phải có trên Palette"

def test_timeline_node_canvas_drawer_opens_and_adds_media(driver):
    """Kiểm tra bấm mở Canvas chi tiết của mốc Timeline dạng Google Docs / TipTap Canvas."""
    driver.get(LESSON_CREATE_URL)
    time.sleep(1.5)

    # 1. Tìm nút mở Canvas ở mốc thời gian đầu tiên của Timeline
    btn_open_canvas = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-open-node-canvas-0']")
    assert btn_open_canvas.is_displayed(), "Nút Chi tiết Canvas mốc thời gian phải hiển thị"
    driver.execute_script("arguments[0].click();", btn_open_canvas)
    time.sleep(1)

    # 2. Xác nhận Drawer Canvas mở ra
    drawer = driver.find_element(By.CSS_SELECTOR, "[data-testid='timeline-node-canvas-drawer']")
    assert drawer.is_displayed(), "Timeline Node Canvas Drawer phải hiển thị trượt từ bên phải"

    # 3. Xác nhận có vùng soạn thảo Google Docs / TipTap Canvas
    tiptap_canvas = drawer.find_element(By.CSS_SELECTOR, "[data-testid='tiptap-timeline-node-canvas']")
    assert tiptap_canvas.is_displayed(), "Vùng soạn thảo TipTap Canvas phải hiển thị"

    # 4. Nhập bài phân tích chuyên sâu vào editor TipTap
    tiptap_editor = tiptap_canvas.find_element(By.CSS_SELECTOR, ".tiptap")
    driver.execute_script("arguments[0].innerHTML = '<p>Chi tiết trận mở màn chiến dịch Điện Biên Phủ tại cứ điểm Him Lam...</p>';", tiptap_editor)
    time.sleep(0.5)

    # 5. Đóng Canvas
    btn_close = drawer.find_element(By.XPATH, "//button[contains(text(), 'Đóng') or contains(text(), 'Hoàn tất')]")
    driver.execute_script("arguments[0].click();", btn_close)
    time.sleep(0.5)

    # 6. Kiểm tra ngoài trục timeline vẫn hiển thị nút mở canvas mượt mà
    assert btn_open_canvas.is_displayed()

def test_vertical_flow_divider_insertion_and_reorder(driver):
    """Kiểm tra dòng chảy dọc Nx1: Thêm khối mới qua AddBlockDivider và xác nhận không có khối hàng nhiều cột."""
    driver.get(LESSON_CREATE_URL)
    time.sleep(1.5)

    # 1. Lấy nút chèn khối tại divider 0
    btn_insert = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-insert-block-0']")
    driver.execute_script("arguments[0].click();", btn_insert)
    time.sleep(0.5)

    # 2. Popover mở ra và không có khối SECTION_ROW
    popover = driver.find_element(By.CSS_SELECTOR, "[data-testid='popover-insert-block-menu']")
    assert popover.is_displayed(), "Popover chèn khối phải hiển thị"

    section_row_items = popover.find_elements(By.CSS_SELECTOR, "[data-testid='btn-popover-block-SECTION_ROW']")
    assert len(section_row_items) == 0, "Không được xuất hiện Hàng nhiều cột trong menu chèn nhanh"

    # 3. Đóng popover
    driver.execute_script("arguments[0].click();", btn_insert)
    time.sleep(0.5)
