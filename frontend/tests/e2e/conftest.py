"""Cấu hình fixture Pytest cho bộ Selenium E2E Smoke."""

import pytest

from .config import E2eConfig
from .driver_factory import WebDriverFactory


@pytest.fixture(scope="session")
def e2e_config() -> E2eConfig:
    return E2eConfig()


@pytest.fixture()
def driver(e2e_config: E2eConfig):
    chrome = WebDriverFactory.create(e2e_config)
    yield chrome
    chrome.quit()
