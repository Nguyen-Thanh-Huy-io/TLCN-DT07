"""Page Object Models (POM) cho các luồng người dùng cốt lõi trên HISGO."""

from typing import Iterable

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from .config import AccountTabLabels, E2eConfig, FollowButtonLabels, Routes


class BasePage:
    """Lớp cơ sở cung cấp thao tác chờ đợi tường minh và điều hướng chuẩn."""

    def __init__(self, driver: WebDriver, config: E2eConfig) -> None:
        self.driver = driver
        self.config = config
        self.wait = WebDriverWait(driver, config.wait_timeout_sec)

    def open(self, route: str) -> None:
        normalized = route if route.startswith("/") else f"/{route}"
        self.driver.get(f"{self.config.fe_base_url}{normalized}")
        self.wait.until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )

    def wait_visible(self, by: By, locator: str) -> WebElement:
        return self.wait.until(EC.visibility_of_element_located((by, locator)))

    def wait_clickable(self, by: By, locator: str) -> WebElement:
        return self.wait.until(EC.element_to_be_clickable((by, locator)))

    def wait_url_contains(self, fragment: str) -> None:
        self.wait.until(EC.url_contains(fragment))

    def wait_text_present(self, text: str) -> None:
        self.wait.until(lambda d: text in d.find_element(By.TAG_NAME, "body").text)

    def click_js(self, element: WebElement) -> None:
        self.driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});", element
        )
        self.driver.execute_script("arguments[0].click();", element)


class LoginPage(BasePage):
    EMAIL_INPUT = (By.ID, "email")
    PASSWORD_INPUT = (By.ID, "password")
    SUBMIT_BTN = (By.CSS_SELECTOR, "form button[type='submit']")
    ERROR_BOX = (By.CSS_SELECTOR, "form div.text-rose-700")

    def open_login(self, redirect: str | None = None) -> None:
        path = Routes.LOGIN.value
        if redirect:
            path = f"{path}?redirect={redirect}"
        self.open(path)

    def submit_credentials(self, email: str, password: str) -> None:
        email_el = self.wait_visible(*self.EMAIL_INPUT)
        email_el.clear()
        email_el.send_keys(email)

        pwd_el = self.wait_visible(*self.PASSWORD_INPUT)
        pwd_el.clear()
        pwd_el.send_keys(password)

        submit_el = self.wait_clickable(*self.SUBMIT_BTN)
        submit_el.click()

    def get_error_text(self) -> str:
        return self.wait_visible(*self.ERROR_BOX).text


class PublicArticlesPage(BasePage):
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[aria-label='Tìm bài viết lịch sử']")

    def open_list(self) -> None:
        self.open(Routes.ARTICLES.value)
        self.wait_visible(*self.SEARCH_INPUT)

    def search(self, query: str) -> None:
        search_el = self.wait_visible(*self.SEARCH_INPUT)
        search_el.clear()
        search_el.send_keys(query)


class AuthorProfileFollowPage(BasePage):
    """Kiểm thử Author Follow trên trang hồ sơ thành viên và chi tiết bài viết."""

    def open_member_profile(self, username: str) -> None:
        self.open(f"{Routes.COMMUNITY_MEMBER.value}/{username}")

    def open_article_detail(self, slug: str) -> None:
        self.open(f"{Routes.ARTICLES.value}/{slug}")

    def find_follow_button(self) -> WebElement:
        xpath = (
            "//button["
            f".//span[normalize-space()='{FollowButtonLabels.FOLLOW.value}'] or "
            f".//span[normalize-space()='{FollowButtonLabels.FOLLOWING.value}']"
            "]"
        )
        return self.wait_clickable(By.XPATH, xpath)

    def toggle_follow_and_wait_label(self, expected_label: str) -> WebElement:
        btn = self.find_follow_button()
        self.click_js(btn)
        expected_xpath = (
            f"//button[.//span[normalize-space()='{expected_label}']]"
        )
        return self.wait_visible(By.XPATH, expected_xpath)


class PracticeQuizPage(BasePage):
    START_BTN = (
        By.XPATH,
        "//button[contains(normalize-space(), 'Bắt đầu làm bài')]",
    )
    SUBMIT_BTN = (
        By.XPATH,
        "//button[contains(normalize-space(), 'Nộp bài & Xem điểm')]",
    )

    def open_practice(self) -> None:
        self.open(Routes.PRACTICE.value)

    def select_quiz_by_title(self, title: str) -> None:
        card_xpath = f"//button[contains(normalize-space(), '{title}')]"
        el = self.wait_clickable(By.XPATH, card_xpath)
        self.click_js(el)

    def start_quiz(self) -> None:
        start_btn = self.wait_clickable(*self.START_BTN)
        self.click_js(start_btn)

    def choose_answer_option(self, option_texts: Iterable[str]) -> None:
        for text in option_texts:
            try:
                opt = self.driver.find_element(
                    By.XPATH,
                    f"//button[contains(normalize-space(), '{text}')] | //label[contains(normalize-space(), '{text}')]",
                )
                self.click_js(opt)
                return
            except Exception:
                continue
        raise AssertionError(f"Không tìm thấy đáp án trong {list(option_texts)}")

    def submit_quiz(self) -> None:
        btn = self.wait_clickable(*self.SUBMIT_BTN)
        self.click_js(btn)


class AccountPage(BasePage):
    def open_account(self) -> None:
        self.open(Routes.ACCOUNT.value)
        self.wait_text_present(AccountTabLabels.PROFILE.value)

    def switch_tab(self, tab_label: AccountTabLabels) -> None:
        btn = self.wait_clickable(
            By.XPATH, f"//button[.//span[normalize-space()='{tab_label.value}']]"
        )
        self.click_js(btn)
