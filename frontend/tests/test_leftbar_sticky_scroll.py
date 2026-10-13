import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
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

def test_leftbar_has_sticky_and_scrollable_classes(driver):
    driver.get(URL)
    time.sleep(2)

    # 1. Kiểm tra aside bên trái có các class sticky và scroll độc lập
    aside = driver.find_element(By.CSS_SELECTOR, "aside[data-testid='lesson-block-palette']")
    aside_parent = aside.find_element(By.XPATH, "..")
    class_attr = aside_parent.get_attribute("class") or ""

    assert "sticky" in class_attr, "Leftbar parent aside phải có class sticky"
    assert "overflow-y-auto" in class_attr, "Leftbar parent aside phải có class overflow-y-auto để cuộn độc lập"
    assert "self-start" in class_attr, "Leftbar parent aside phải có self-start để sticky hoạt động trong flex"

def test_leftbar_remains_visible_and_interactive_when_scrolling_down(driver):
    driver.get(URL)
    time.sleep(2)

    # 2. Cuộn trang web xuống 500px
    driver.execute_script("window.scrollTo(0, 500);")
    time.sleep(0.5)

    # 3. Nút chèn khối 'Hình ảnh' và 'Video' trên Leftbar vẫn phải hiển thị trên viewport
    btn_img = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-IMAGE']")
    assert btn_img.is_displayed(), "Nút Hình ảnh phải vẫn hiển thị sau khi cuộn trang"

    # 4. Click chèn khối khi trang đang cuộn xuống
    btn_img.click()
    time.sleep(0.5)

    editor_box = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box")
    assert "Hình ảnh tư liệu" in editor_box.text, "Khối hình ảnh phải được chèn thành công kể cả khi đang cuộn trang xuống"
