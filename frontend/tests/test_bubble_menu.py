import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

URL = "http://localhost:3000/lessons/create"

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

def test_bubble_menu_appears_on_text_selection_without_line_wrapping(driver):
    driver.get(URL)
    time.sleep(2)

    # 1. Tìm vùng soạn thảo ProseMirror
    editor_elem = driver.find_element(By.CSS_SELECTOR, ".tiptap.ProseMirror")
    assert editor_elem.is_displayed(), "Trình soạn thảo TipTap phải hiển thị"

    # Click vào editor và gõ văn bản
    editor_elem.click()
    time.sleep(0.5)

    # Thêm văn bản mẫu
    driver.execute_script("""
        const editor = arguments[0];
        editor.innerHTML = '<p>Chiến thắng Điện Biên Phủ lừng lẫy năm châu chấn động địa cầu</p>';
    """, editor_elem)
    time.sleep(0.5)

    p_elem = editor_elem.find_element(By.TAG_NAME, "p")

    # Bôi đen đoạn text để kích hoạt BubbleMenu
    actions = ActionChains(driver)
    actions.double_click(p_elem).perform()
    time.sleep(1)

    # 2. Kiểm tra BubbleMenu xuất hiện
    bubble_menu = driver.find_element(By.CSS_SELECTOR, "[data-testid='tiptap-bubble-menu']")
    assert bubble_menu.is_displayed(), "BubbleMenu phải hiển thị khi bôi đen text"

    # 3. Kiểm tra BubbleMenu có layout dạng flex row không bị rớt hàng
    display = bubble_menu.value_of_css_property("display")
    flex_direction = bubble_menu.value_of_css_property("flex-direction")
    assert "flex" in display, f"BubbleMenu phải có display: flex, hiện tại: {display}"
    assert "row" in flex_direction, f"BubbleMenu phải có flex-direction: row, hiện tại: {flex_direction}"

    # 4. Kiểm tra các nút bấm trên cùng một hàng ngang (không rớt dòng như trong image.png)
    btn_bold = driver.find_element(By.CSS_SELECTOR, "[data-testid='bubble-btn-bold']")
    btn_italic = driver.find_element(By.CSS_SELECTOR, "[data-testid='bubble-btn-italic']")
    btn_strike = driver.find_element(By.CSS_SELECTOR, "[data-testid='bubble-btn-strike']")
    btn_h2 = driver.find_element(By.CSS_SELECTOR, "[data-testid='bubble-btn-h2']")
    btn_link = driver.find_element(By.CSS_SELECTOR, "[data-testid='bubble-btn-link']")

    bold_y = btn_bold.location['y']
    italic_y = btn_italic.location['y']
    strike_y = btn_strike.location['y']
    h2_y = btn_h2.location['y']
    link_y = btn_link.location['y']

    # Tất cả các nút phải cùng nằm trên 1 hàng ngang (sai số tối đa 4px do padding)
    assert abs(bold_y - italic_y) <= 4, f"Nút Italic bị rớt dòng so với Bold: bold_y={bold_y}, italic_y={italic_y}"
    assert abs(bold_y - strike_y) <= 4, f"Nút Strike bị rớt dòng so với Bold: bold_y={bold_y}, strike_y={strike_y}"
    assert abs(bold_y - h2_y) <= 4, f"Nút H2 bị rớt dòng so với Bold: bold_y={bold_y}, h2_y={h2_y}"
    assert abs(bold_y - link_y) <= 4, f"Nút Link bị rớt dòng so với Bold: bold_y={bold_y}, link_y={link_y}"
