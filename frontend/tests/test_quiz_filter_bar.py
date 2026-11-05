import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000/luyen-tap"


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


def test_quiz_briefing_start_exam_and_no_premature_stats(driver):
    driver.get(BASE_URL)
    time.sleep(2)

    # 1. Kiểm tra sự hiện diện của ô tìm kiếm bộ đề và chip filters
    search_input = driver.find_element(By.CSS_SELECTOR, "input[aria-label='Tìm kiếm bộ đề luyện tập']")
    assert search_input is not None

    chip_buttons = driver.find_elements(By.CSS_SELECTOR, "button.rounded-full")
    assert len(chip_buttons) >= 1

    # 2. Kiểm tra MÀN HÌNH CHỜ (Quiz Briefing Card) - Khi chưa bắt đầu làm bài
    # Tuyệt đối chưa render các câu hỏi trắc nghiệm lựa chọn
    questions_boxes = driver.find_elements(By.CSS_SELECTOR, "[id^='question-box-']")
    assert len(questions_boxes) == 0, "Khi chưa bấm bắt đầu, không được hiển thị danh sách câu hỏi!"

    # Kiểm tra nút 'Bắt đầu làm bài thi' hiện diện trang trọng
    start_btn = driver.find_element(By.XPATH, "//button[contains(., 'Bắt đầu làm bài thi')]")
    assert start_btn is not None

    # Kiểm tra tuyệt đối KHÔNG có nút 'Xem Thống Kê Nộp Bài' làm xao nhãng
    stats_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Xem Thống Kê Nộp Bài')]")
    assert len(stats_buttons) == 0, "Không được đặt nút thống kê trong khu vực chuẩn bị/làm bài!"

    # 3. Thí sinh bấm 'Bắt đầu làm bài thi'
    start_btn.click()
    time.sleep(1)

    # 4. Sau khi bấm bắt đầu: Các câu hỏi trắc nghiệm mới xuất hiện!
    questions_after_start = driver.find_elements(By.CSS_SELECTOR, "[id^='question-box-']")
    assert len(questions_after_start) > 0, "Sau khi bấm bắt đầu, các câu hỏi trắc nghiệm phải hiển thị!"

    # Vẫn tuyệt đối KHÔNG có nút 'Xem Thống Kê Nộp Bài' trong header bài thi
    stats_buttons_during = driver.find_elements(By.XPATH, "//button[contains(., 'Xem Thống Kê Nộp Bài')]")
    assert len(stats_buttons_during) == 0

    # 5. Thí sinh làm câu hỏi đầu tiên
    first_q_options = questions_after_start[0].find_elements(By.CSS_SELECTOR, "button")
    if len(first_q_options) > 0:
        first_q_options[0].click()
        time.sleep(0.5)

    # 6. Bấm nộp bài
    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Nộp bài')]")
    submit_btn.click()
    time.sleep(1)

    # 7. Sau khi nộp bài: Nút xem Thống kê & Phổ điểm MỚI XUẤT HIỆN
    stats_after_submit = driver.find_elements(By.XPATH, "//button[contains(., 'Xem Phổ Điểm & Thống Kê')]")
    assert len(stats_after_submit) > 0, "Sau khi nộp bài, phải có nút xem phổ điểm & thống kê!"
