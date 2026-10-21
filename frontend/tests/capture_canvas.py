from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--window-size=1440,900')
d = webdriver.Chrome(options=opts)
try:
    d.get('http://localhost:3000/lessons/create')
    wait = WebDriverWait(d, 15)
    btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='btn-open-node-canvas-0']")))
    d.execute_script("arguments[0].click();", btn)
    time.sleep(1.5)
    d.save_screenshot('screenshot_tiptap_docs_canvas.png')
    print("CAPTURED_SUCCESS")
finally:
    d.quit()
