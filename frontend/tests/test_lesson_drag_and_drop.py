import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
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

def test_block_buttons_have_draggable_attribute(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    blocks = ["TEXT", "IMAGE", "VIDEO", "TIMELINE", "MAP", "CHARACTER", "EVENT", "COMPARISON_TABLE", "QUIZ", "RESOURCE_LINK"]
    for block_type in blocks:
        btn = driver.find_element(By.CSS_SELECTOR, f"[data-testid='btn-block-{block_type}']")
        assert btn.get_attribute("draggable") == "true", f"Nút khối {block_type} phải có thuộc tính draggable=true"

def test_html5_drag_and_drop_block_into_editor(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # Giả lập sự kiện HTML5 Drag and Drop qua JavaScript
    js_drag_drop_script = """
    const source = document.querySelector("[data-testid='btn-block-MAP']");
    const target = document.querySelector(".tiptap-content-box .tiptap");
    
    if (!source || !target) return false;

    const dataTransfer = new DataTransfer();
    dataTransfer.setData('application/x-lesson-block', 'MAP');
    dataTransfer.setData('text/plain', 'Bản đồ');
    dataTransfer.effectAllowed = 'copy';

    // 1. dragstart
    const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
    });
    source.dispatchEvent(dragStartEvent);

    // 2. dragover trên target để kích hoạt đường chỉ báo vị trí thả
    const rect = target.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer,
        clientX: rect.left + 50,
        clientY: rect.top + 80
    });
    target.dispatchEvent(dragOverEvent);

    // 3. drop vào target
    const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer,
        clientX: rect.left + 50,
        clientY: rect.top + 80
    });
    target.dispatchEvent(dropEvent);

    return true;
    """

    res = driver.execute_script(js_drag_drop_script)
    assert res is True, "Script giả lập kéo thả phải chạy thành công"
    time.sleep(1.5)

    # Kiểm tra nội dung TipTap editor có xuất hiện khối Bản đồ
    editor_content = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box")
    assert "Bản đồ" in editor_content.text or "Địa bàn tác chiến" in editor_content.text, \
        "Nội dung editor phải chứa khối Bản đồ sau khi kéo thả"

def test_click_to_insert_still_works_as_hybrid(driver):
    driver.get(LESSON_CREATE_URL)
    time.sleep(2)

    # Test click chọn vẫn hoạt động song song
    quiz_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-QUIZ']")
    quiz_btn.click()
    time.sleep(1)

    editor_content = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box")
    assert "Câu hỏi củng cố" in editor_content.text, \
        "Click chọn vẫn phải chèn khối Câu hỏi vào editor (chế độ hybrid)"
