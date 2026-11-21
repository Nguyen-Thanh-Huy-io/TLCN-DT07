"""Cấu hình & hằng số tập trung cho bộ kiểm thử Selenium E2E (không magic string)."""

import os
from dataclasses import dataclass
from enum import Enum


class Routes(str, Enum):
    HOME = "/"
    LOGIN = "/login"
    REGISTER = "/dang-ky"
    ACCOUNT = "/tai-khoan"
    ARTICLES = "/bai-viet"
    PRACTICE = "/luyen-tap"
    CURRICULUM = "/chuong-trinh-hoc"
    COMMUNITY = "/cong-dong"
    COMMUNITY_MEMBER = "/cong-dong/thanh-vien"
    CMS_HOME = "/cms"
    CMS_ARTICLES = "/articles"
    CMS_REVIEW = "/review"


class ApiRoutes(str, Enum):
    HEALTH = "/"
    AUTH_LOGIN = "/auth/login"
    PUBLIC_ARTICLES = "/public/articles"
    PUBLIC_QUIZZES = "/public/quizzes"
    FOLLOW_STATUS = "/posts/users"


class AccountTabLabels(str, Enum):
    PROFILE = "Hồ sơ sử học"
    LEARNING = "Lộ trình của tôi"
    GAMIFICATION = "Mục tiêu & Thành tựu"
    BOOKMARKS = "Tư liệu đã lưu"
    FLASHCARDS = "Thẻ ghi nhớ"
    MINDMAPS = "Sơ đồ tư duy"
    SECURITY = "Bảo mật & Phiên"


class FollowButtonLabels(str, Enum):
    FOLLOW = "Theo dõi"
    FOLLOWING = "Đang theo dõi"


class UiMessages(str, Enum):
    INVALID_LOGIN_SUBSTRING = "invalid email or password"
    QUIZ_SUBMITTED = "Bài thi đã nộp thành công"


@dataclass(frozen=True)
class E2eSeedAccounts:
    learner_email: str = "e2e_ui_learner@example.com"
    learner_username: str = "e2e_ui_learner"
    author_email: str = "e2e_ui_author@example.com"
    author_username: str = "e2e_ui_author"
    admin_email: str = "e2e_ui_admin@example.com"
    admin_username: str = "e2e_ui_admin"
    password: str = "HisgoE2e@2026!"
    article_slug: str = "e2e-ui-khoi-nghia-hai-ba-trung"
    article_title: str = "E2E Khởi nghĩa Hai Bà Trưng"
    quiz_title: str = "E2E Đề luyện tập Hai Bà Trưng"


@dataclass(frozen=True)
class E2eConfig:
    fe_base_url: str = os.getenv("E2E_FE_URL", "http://127.0.0.1:3010").rstrip("/")
    be_base_url: str = os.getenv("E2E_BE_URL", "http://127.0.0.1:5010").rstrip("/")
    headless: bool = os.getenv("E2E_HEADLESS", "1") != "0"
    wait_timeout_sec: int = int(os.getenv("E2E_WAIT_TIMEOUT", "15"))
    accounts: E2eSeedAccounts = E2eSeedAccounts()
