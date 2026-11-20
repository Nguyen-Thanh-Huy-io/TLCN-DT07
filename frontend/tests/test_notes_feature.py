import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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


def _select_paragraph_phrase(driver, paragraph, start_offset=0, length=18):
    driver.execute_script(
        """
        const p = arguments[0];
        const startOffset = arguments[1];
        const length = arguments[2];
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node && (node.parentElement?.closest('[data-note-callout]') || node.nodeValue.trim().length < startOffset + 10)) {
          node = walker.nextNode();
        }
        if (!node) throw new Error('Không tìm thấy text node đủ dài');
        const safeStart = Math.min(startOffset, Math.max(0, node.nodeValue.length - 6));
        const safeEnd = Math.min(node.nodeValue.length, safeStart + length);
        const range = document.createRange();
        range.setStart(node, safeStart);
        range.setEnd(node, safeEnd);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.dispatchEvent(new Event('mouseup', { bubbles: true }));
        """,
        paragraph,
        start_offset,
        length,
    )


def test_consolidated_dock_mini_pill_circle_callout_sticky_and_quick_pen(driver):
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 25)
    time.sleep(2)

    # 1. Dock trái tinh gọn <= 4 nút chính + nút thu gọn
    dock = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "nav[aria-label='Thanh công cụ đọc bài viết']"))
    )
    dock_buttons = dock.find_elements(By.TAG_NAME, "button")
    assert len(dock_buttons) <= 6, f"Dock phải tinh gọn <= 6 nút kể cả thu gọn, thực tế: {len(dock_buttons)}"

    # Mở modal thống nhất "Trong bài" (Mục lục + Liên quan gộp)
    explore_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Trong bài (Mục lục & Liên quan)']"))
    )
    driver.execute_script("arguments[0].click();", explore_btn)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='dialog'][aria-label='Trong bài']")))
    close_explore = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Đóng bảng trong bài']")))
    close_explore.click()
    time.sleep(0.3)

    # 2. Khoanh tròn từ khóa (CIRCLE) bằng Mini Pill 1 dòng
    paragraph = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".ue-article-content p")))
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", paragraph)
    time.sleep(0.4)
    _select_paragraph_phrase(driver, paragraph, 0, 12)

    circle_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Khoanh chữ']")))
    circle_btn.click()
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "span[data-note-layer].rounded-full.border-2")))

    # 3. Điền chữ bổ sung trực tiếp ngay tại dòng (CALLOUT)
    _select_paragraph_phrase(driver, paragraph, 18, 14)
    callout_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[title='Điền chữ bổ sung ngay tại dòng']"))
    )
    callout_btn.click()
    callout_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-note-layer] input")))
    callout_text = "bổ sung trên dòng"
    callout_input.send_keys(callout_text)
    callout_input.send_keys(Keys.ENTER)
    wait.until(EC.presence_of_element_located((By.XPATH, f"//button[@data-note-callout][contains(., '{callout_text}')]")))

    # 4. Bật chế độ "Tô nhanh" (tô ngẫu nhiên liên tiếp không bật popup)
    _select_paragraph_phrase(driver, paragraph, 35, 10)
    pen_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Bật chế độ tô nhanh liên tiếp']"))
    )
    pen_btn.click()
    quick_bar = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='toolbar'][aria-label='Thanh bút tô nhanh liên tiếp']"))
    )
    assert quick_bar is not None
    # Kéo bôi đen trong chế độ tô nhanh -> không mở popup mới mà lưu ngay
    _select_paragraph_phrase(driver, paragraph, 48, 12)
    time.sleep(0.8)
    driver.find_element(By.CSS_SELECTOR, "button[aria-label='Tắt bút tô nhanh']").click()
    time.sleep(0.3)

    # 5. Hover vào đoạn văn -> bấm '+' -> gộp thêm đoạn dưới -> gắn nhãn #Cụm_Lê_Lợi -> hiện Móc ngoặc '}' + Sticky ngoài lề
    ActionChains(driver).move_to_element(paragraph).perform()
    plus_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Ghi chú đoạn văn này']")))
    driver.execute_script("arguments[0].click();", plus_btn)

    expand_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Gộp đoạn dưới')]")))
    expand_btn.click()

    label_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='Thêm nhãn']")))
    label_input.send_keys("Cụm_Lê_Lợi")
    label_input.send_keys(Keys.ENTER)

    sticky_content = "Sticky tự động: Tổng kết ý chính cụm 2 đoạn."
    composer_textarea = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-note-layer] textarea")))
    composer_textarea.send_keys(sticky_content)
    save_btn = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//div[@data-note-layer]//button[normalize-space()='Lưu']"))
    )
    save_btn.click()
    time.sleep(1.5)

    # Kiểm tra cả thẻ Sticky lề phải và SVG móc ngoặc '}'
    sticky_card = wait.until(
        EC.presence_of_element_located((By.XPATH, f"//button[@data-note-layer][contains(., '{sticky_content}')]"))
    )
    assert sticky_card is not None
    assert driver.find_element(By.CSS_SELECTOR, "div[data-note-layer] svg path") is not None

    # Kiểm tra không xuất hiện thanh cuộn ngang gây khó chịu
    no_horizontal_overflow = driver.execute_script(
        "return document.documentElement.scrollWidth <= document.documentElement.clientWidth;"
    )
    assert no_horizontal_overflow, "Trang bị tràn chiều ngang tạo thanh cuộn ngang!"

    # 5b. Thử chế độ Vẽ tự do (Draw Pen gọn 1 dòng + vẽ nét giữ hiển thị tức thì 0ms)
    draw_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Vẽ & điền chữ tự do']")))
    driver.execute_script("arguments[0].click();", draw_btn)
    draw_bar = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='toolbar'][aria-label='Thanh vẽ tự do trên bài đọc']"))
    )
    assert draw_bar is not None
    # Thanh vẽ phải gọn 1 dòng, không rớt xuống 2 hàng và không tràn ngang
    toolbar_rect = driver.execute_script(
        "const r = arguments[0].getBoundingClientRect(); return { h: r.height, w: r.width, right: r.right, vw: document.documentElement.clientWidth };",
        draw_bar,
    )
    assert toolbar_rect["h"] <= 56, f"Thanh vẽ bị rớt dòng quá cao: {toolbar_rect['h']}px"
    assert toolbar_rect["right"] <= toolbar_rect["vw"] + 1, "Thanh vẽ vượt quá chiều ngang viewport!"

    # Quẹt 1 đường nét bút trên đoạn văn -> path phải giữ nguyên ngay lập tức sau pointerup (không biến mất)
    svg_el = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-note-layer] svg")))
    paths_before = len(svg_el.find_elements(By.TAG_NAME, "path"))
    ActionChains(driver).move_to_element_with_offset(paragraph, 10, 10).click_and_hold().move_by_offset(120, 8).release().perform()
    paths_after_immediate = len(svg_el.find_elements(By.TAG_NAME, "path"))
    assert paths_after_immediate > paths_before, f"Nét vừa vẽ bị mất ngay sau pointerup (before={paths_before}, after={paths_after_immediate})!"

    # Bề rộng sau khi bật lớp SVG vẽ & vẽ nét vẫn phải nằm gọn trong viewport
    no_overflow_draw = driver.execute_script(
        "return document.documentElement.scrollWidth <= document.documentElement.clientWidth;"
    )
    assert no_overflow_draw, "Lớp SVG vẽ tự do gây tràn chiều ngang!"
    driver.find_element(By.CSS_SELECTOR, "button[aria-label='Thoát chế độ vẽ']").click()
    time.sleep(0.3)

    # 6. Mở Sổ ghi chú -> chuyển chế độ "Theo cụm nhóm"
    notes_btn = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "button[aria-label='Sổ ghi chú']")))
    driver.execute_script("arguments[0].click();", notes_btn)
    wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Sổ Ghi Chú Cá Nhân')]")))

    cluster_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Theo cụm nhóm')]")))
    cluster_tab.click()
    wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), '#Cụm_Lê_Lợi')]")))

    # 7. Dọn dẹp toàn bộ ghi chú thử nghiệm vừa tạo
    driver.execute_script("window.confirm = function() { return true; };")
    for _ in range(10):
        del_btns = driver.find_elements(By.XPATH, "//button[@title='Xoá ghi chú']")
        if not del_btns:
            break
        driver.execute_script("arguments[0].click();", del_btns[0])
        time.sleep(0.4)
