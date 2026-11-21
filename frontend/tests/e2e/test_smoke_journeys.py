"""Bộ Selenium E2E Smoke kiểm chứng trọn vẹn các luồng Public, Auth, Author Follow, Quiz và Account."""

from selenium.webdriver.common.by import By

from .config import (
    AccountTabLabels,
    E2eConfig,
    FollowButtonLabels,
    Routes,
    UiMessages,
)
from .driver_factory import WebDriverFactory
from .pages import (
    AccountPage,
    AuthorProfileFollowPage,
    BasePage,
    LoginPage,
    PracticeQuizPage,
    PublicArticlesPage,
)


def test_landing_page_loads_cleanly(driver, e2e_config: E2eConfig) -> None:
    page = BasePage(driver, e2e_config)
    page.open(Routes.HOME.value)
    assert "HISGO" in driver.title or "HISGO" in driver.find_element(By.TAG_NAME, "body").text
    assert WebDriverFactory.collect_severe_console_errors(driver) == []


def test_public_articles_search_positive_and_empty_boundary(
    driver, e2e_config: E2eConfig
) -> None:
    page = PublicArticlesPage(driver, e2e_config)
    page.open_list()
    page.wait_text_present(e2e_config.accounts.article_title)

    page.search("Hai Bà Trưng")
    page.wait_text_present(e2e_config.accounts.article_title)

    page.search("chuoi_khong_ton_tai_boundary_99999")
    page.wait.until(
        lambda d: e2e_config.accounts.article_title
        not in d.find_element(By.TAG_NAME, "body").text
    )


def test_cms_access_gate_redirects_unauthenticated_user(
    driver, e2e_config: E2eConfig
) -> None:
    page = BasePage(driver, e2e_config)
    page.open(Routes.CMS_HOME.value)
    page.wait_url_contains(Routes.LOGIN.value)
    assert "redirect=" in driver.current_url


def test_login_negative_wrong_password_shows_error(
    driver, e2e_config: E2eConfig
) -> None:
    login_page = LoginPage(driver, e2e_config)
    login_page.open_login()
    login_page.submit_credentials(
        e2e_config.accounts.learner_email, "WrongPassword#000"
    )
    err = login_page.get_error_text().lower()
    assert UiMessages.INVALID_LOGIN_SUBSTRING.value in err
    assert Routes.LOGIN.value in driver.current_url


def test_login_positive_redirects_home(driver, e2e_config: E2eConfig) -> None:
    login_page = LoginPage(driver, e2e_config)
    login_page.open_login()
    login_page.submit_credentials(
        e2e_config.accounts.learner_email, e2e_config.accounts.password
    )
    login_page.wait.until(lambda d: Routes.LOGIN.value not in d.current_url)
    assert driver.current_url.rstrip("/") == e2e_config.fe_base_url


def test_author_follow_unauthenticated_redirects_to_login(
    driver, e2e_config: E2eConfig
) -> None:
    page = AuthorProfileFollowPage(driver, e2e_config)
    page.open_article_detail(e2e_config.accounts.article_slug)
    page.wait_text_present(e2e_config.accounts.article_title)
    follow_btn = page.find_follow_button()
    page.click_js(follow_btn)
    page.wait_url_contains(Routes.LOGIN.value)


def test_author_follow_end_to_end_persist_and_unfollow(
    driver, e2e_config: E2eConfig
) -> None:
    login_page = LoginPage(driver, e2e_config)
    login_page.open_login()
    login_page.submit_credentials(
        e2e_config.accounts.learner_email, e2e_config.accounts.password
    )
    login_page.wait.until(lambda d: Routes.LOGIN.value not in d.current_url)

    follow_page = AuthorProfileFollowPage(driver, e2e_config)
    follow_page.open_article_detail(e2e_config.accounts.article_slug)
    follow_page.wait_text_present(e2e_config.accounts.article_title)

    follow_page.toggle_follow_and_wait_label(FollowButtonLabels.FOLLOWING.value)

    follow_page.open_member_profile(e2e_config.accounts.author_username)
    follow_page.wait_text_present(FollowButtonLabels.FOLLOWING.value)

    driver.refresh()
    follow_page.wait_text_present(FollowButtonLabels.FOLLOWING.value)

    follow_page.toggle_follow_and_wait_label(FollowButtonLabels.FOLLOW.value)


def test_practice_quiz_submit_and_score(driver, e2e_config: E2eConfig) -> None:
    quiz_page = PracticeQuizPage(driver, e2e_config)
    quiz_page.open_practice()
    quiz_page.select_quiz_by_title(e2e_config.accounts.quiz_title)
    quiz_page.start_quiz()
    quiz_page.choose_answer_option(["Năm 40 SCN"])
    quiz_page.submit_quiz()
    quiz_page.wait_text_present(UiMessages.QUIZ_SUBMITTED.value)
    assert "100%" in driver.find_element(By.TAG_NAME, "body").text


def test_account_learning_tabs_render_authenticated(
    driver, e2e_config: E2eConfig
) -> None:
    login_page = LoginPage(driver, e2e_config)
    login_page.open_login()
    login_page.submit_credentials(
        e2e_config.accounts.learner_email, e2e_config.accounts.password
    )
    login_page.wait.until(lambda d: Routes.LOGIN.value not in d.current_url)

    account_page = AccountPage(driver, e2e_config)
    account_page.open_account()
    for tab in (
        AccountTabLabels.FLASHCARDS,
        AccountTabLabels.MINDMAPS,
        AccountTabLabels.BOOKMARKS,
        AccountTabLabels.GAMIFICATION,
    ):
        account_page.switch_tab(tab)

    assert WebDriverFactory.collect_severe_console_errors(driver) == []
