"""Factory khởi tạo Chrome WebDriver thống nhất cho E2E Selenium."""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from .config import E2eConfig


class WebDriverFactory:
    """Tạo ChromeDriver cấu hình chuẩn (headless, console log, viewport desktop)."""

    @staticmethod
    def create(config: E2eConfig) -> webdriver.Chrome:
        options = Options()
        if config.headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1440,1080")
        options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        return driver

    @staticmethod
    def collect_severe_console_errors(driver: webdriver.Chrome) -> list[str]:
        """Lọc lỗi SEVERE trên browser console (bỏ qua 401/403 chủ đích khi test âm)."""
        try:
            logs = driver.get_log("browser")
        except Exception:
            return []
        errors: list[str] = []
        for entry in logs:
            if entry.get("level") == "SEVERE":
                msg = str(entry.get("message", ""))
                if "favicon.ico" in msg:
                    continue
                errors.append(msg)
        return errors
