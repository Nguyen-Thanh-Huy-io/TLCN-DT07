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

def test_block_palette_divided_into_two_sections_matching_img2(driver):
    driver.get(URL)
    time.sleep(2)

    # 1. Kiểm tra tồn tại 2 nhóm đúng thiết kế img2.png
    basic_section = driver.find_element(By.CSS_SELECTOR, "[data-testid='section-basic-blocks']")
    assert basic_section.is_displayed(), "Phải có phần 'Nội dung cơ bản'"
    assert "Nội dung cơ bản" in basic_section.text

    spec_section = driver.find_element(By.CSS_SELECTOR, "[data-testid='section-specialized-blocks']")
    assert spec_section.is_displayed(), "Phải có phần 'Khối chuyên biệt'"
    assert "Khối chuyên biệt" in spec_section.text

def test_basic_blocks_contain_all_4_items_with_descriptions(driver):
    driver.get(URL)
    time.sleep(1)

    basic_section = driver.find_element(By.CSS_SELECTOR, "[data-testid='section-basic-blocks']")

    # 1. Văn bản
    btn_text = basic_section.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-TEXT']")
    assert "Văn bản" in btn_text.text
    assert "Đoạn văn, tiêu đề, danh sách..." in btn_text.text

    # 2. Hình ảnh
    btn_img = basic_section.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-IMAGE']")
    assert "Hình ảnh" in btn_img.text
    assert "Ảnh đơn, thư viện ảnh" in btn_img.text

    # 3. Video
    btn_video = basic_section.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-VIDEO']")
    assert "Video" in btn_video.text
    assert "Video từ YouTube, Vimeo, upload" in btn_video.text

    # 4. Tài liệu
    btn_doc = basic_section.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-RESOURCE_LINK']")
    assert "Tài liệu" in btn_doc.text
    assert "PDF, Word, tài liệu đính kèm" in btn_doc.text

def test_clicking_basic_blocks_inserts_content_into_editor(driver):
    driver.get(URL)
    time.sleep(2)

    # Chèn khối Hình ảnh
    btn_img = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-IMAGE']")
    btn_img.click()
    time.sleep(0.5)

    # Chèn khối Video
    btn_video = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-VIDEO']")
    btn_video.click()
    time.sleep(0.5)

    # Chèn khối Tài liệu
    btn_doc = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-block-RESOURCE_LINK']")
    btn_doc.click()
    time.sleep(0.5)

    # Kiểm tra TipTap Editor có các nội dung chèn vào
    editor_text = driver.find_element(By.CSS_SELECTOR, ".tiptap-content-box").text
    assert "Hình ảnh tư liệu" in editor_text, "Editor phải có khối hình ảnh"
    assert "Video" in editor_text or "tài liệu" in editor_text, "Editor phải có khối video hoặc tài liệu"
