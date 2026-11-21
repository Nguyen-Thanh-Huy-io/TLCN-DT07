# KẾ HOẠCH KIỂM THỬ (TEST PLAN) — DỰ ÁN HISGO (TLCN-DT07)

> **Hệ thống:** HISGO — Nền tảng học & tra cứu lịch sử Việt Nam (`NestJS + Prisma/PostgreSQL + Redis + Next.js App Router`)  
> **Phạm vi tài liệu:** Chuẩn hoá chiến lược kiểm thử đa tầng, tiêu chí chất lượng đầu ra và dữ liệu bằng chứng phục vụ bảo vệ & tích hợp CI/CD.

---

## 1. Mục tiêu & Phạm vi kiểm thử (Scope)

### 1.1. Mục tiêu
1. Đảm bảo toàn bộ các luồng nghiệp vụ cốt lõi của người học (đăng nhập, đọc tư liệu công khai, ghi chú, luyện tập Quiz, học theo lộ trình, Flashcards SM-2, Mindmap, Saved Materials, Gamification, Blog/Cộng đồng & Author Follow) và nhân sự CMS (duyệt 2 người, lưu trữ, kiểm duyệt AI Sentinel, quản lý Topic/Tag/Category) vận hành đúng đặc tả.
2. Bao phủ đầy đủ **ca dương (Positive)**, **ca âm (Negative)** và **ca biên (Boundary)**.
3. Đạt ngưỡng **độ phủ dòng lệnh mô-đun cốt lõi >= 70%**, **tỷ lệ tự động hoá >= 70%**, **100% test pass**, và **0 defect mức Critical/Blocker còn mở**.

### 1.2. Trong phạm vi (In-Scope)
- **Backend (`backend/`):** Toàn bộ REST API, AuthGuard/RolesGuard/ContentWriteGuard, Prisma PostgreSQL migrations & transactions, Redis caching/rate-limiting, BullMQ background jobs, WebSocket gateways (`BlogGateway`, `NotificationGateway`).
- **Frontend (`frontend/`):** Các mô-đun logic cốt lõi (Auth session, Quiz grading/filter/topic strategy, Block Builder/TOC, Note anchoring/clustering, Saved Materials normalizer, XSS sanitizer), các component tương tác (`AuthorFollowButton`, `TrueFalseAnswerSelector`), luồng người dùng end-to-end qua trình duyệt thật (`Selenium`).
- **Phi chức năng:** Chịu tải đồng thời API công khai (`p95 <= 1000 ms`, `0` lỗi `5xx`), kiểm tra brute-force/rate-limit endpoint đăng nhập, headers bảo mật (`helmet`) & RBAC isolation.

### 1.3. Ngoài phạm vi / Tồn đọng đã ghi nhận (Out-of-Scope & Known Backlog)
- Tính năng AI RAG / Mindmap AI mở rộng đang phát triển ở nhánh WIP riêng (không tính vào gate baseline hiện tại; phần Mindmap CRUD cốt lõi vẫn được kiểm thử đầy đủ).
- Các hạng mục UI tĩnh hậu cần (như trang cài đặt `SystemSettingsView`) thuộc backlog phát triển tương lai, nằm ngoài phạm vi gate phát hành cốt lõi.

---

## 2. Kiến trúc 5 tầng kiểm thử (Test Pyramid)

| Tầng | Công cụ | Vị trí mã kiểm thử | Mục tiêu & Phạm vi |
|---|---|---|---|
| **Tầng 1: Unit & Component** | **Jest** (BE) · **Vitest + React Testing Library** (FE) | `backend/src/**/*.spec.ts` (69 file)<br>`frontend/tests/unit/*.test.ts(x)` (10 file) | Kiểm tra logic nghiệp vụ thuần, Strategy/Factory/Facade, SM-2 scheduler, XSS sanitize, component UI cô lập |
| **Tầng 2: Integration (Service ↔ DB/Redis)** | **Jest + Prisma + Redis thật** | `backend/test/*.e2e-spec.ts` (bước service/controller qua Nest `TestingModule` đầy đủ) | Kiểm tra `$transaction`, migrations (`22` file), cache invalidation Redis, event listeners |
| **Tầng 3: API End-to-End** | **Supertest + NestJS `AppModule`** | `backend/test/*.e2e-spec.ts` (12 suite / 107 tests) | Kiểm tra HTTP contract, DTO validation (`400`), Auth (`401`), RBAC (`403`), Conflict (`409`), Not Found (`404`) |
| **Tầng 4: E2E UI (Trình duyệt thật)** | **Python `pytest` + Selenium Chrome Headless** | `frontend/tests/e2e/` (`conftest.py`, `pages.py`, `test_smoke_journeys.py` — 9 kịch bản) | Kiểm tra luồng người dùng thật qua Next.js SSR + `/api-proxy` + Backend + Postgres/Redis |
| **Tầng 5: Phi chức năng (Load & Resilience)** | **Node.js HTTP Load Runner** | `backend/test/perf/load-smoke.mjs` (4 kịch bản) | Đo RPS, `avg`, `p95`, `p99`, tỷ lệ `5xx`, burst auth rate-limit & resilience |

---

## 3. Chiến lược môi trường & dữ liệu kiểm thử tách biệt

Tuyệt đối **không chạm dữ liệu dev (`tlcn_db`)** hay tiến trình dev của lập trình viên:
1. **Database & Redis E2E:** `backend/test/e2e-env.ts` tự chuyển `DATABASE_URL` sang database hậu tố `_e2e` (`tlcn_db_e2e` trên Docker `pgvector/pgvector:pg17` cổng `5433`), `REDIS_DB=1` và prefix cache `e2e:`.
2. **Làm sạch tự động:**
   - `npm run test:e2e:prepare` xoá & tạo lại `tlcn_db_e2e`, áp toàn bộ `22` Prisma migrations từ đầu.
   - Các suite BE dùng tiền tố `e2e_test_` và dọn sạch trong `afterAll`.
   - `backend/test/seed-ui-e2e.ts` nạp fixture tiền tố `e2e_ui_` cho Selenium và dọn bằng `--clean` sau khi chạy xong.
3. **Cô lập server UI E2E:** Backend chạy cổng `5010` với `CORS_ORIGINS` cấu hình qua [cors.config.ts](../../backend/src/common/config/cors.config.ts); Frontend chạy cổng `3010` với `NEXT_DIST_DIR=.next-e2e` qua [next.config.ts](../../frontend/next.config.ts) để không xung đột `.next/dev/lock`.

---

## 4. Tiêu chí Đầu vào / Đầu ra (Entry & Exit Criteria)

### Entry Criteria
- Build TypeScript BE (`npx tsc --noEmit`) & FE (`npx tsc --noEmit`) không lỗi.
- ESLint (`--max-warnings=0` trên file sửa, `npm run lint`) đạt 0 errors.
- Docker PostgreSQL (`pgvector/pgvector:pg17`) và Redis (`7.2-alpine`) sẵn sàng.

### Exit Criteria (Bắt buộc đạt trước khi merge/CI release)
1. **Pass Rate:** 100% test tự động ở cả 5 tầng PASS (0 failed, 0 skipped).
2. **Code Coverage:**
   - Backend toàn `src/`: **>= 70%** Lines (thực đo: **76.10%**).
   - Frontend mô-đun cốt lõi (`frontend/vitest.config.mts`): **>= 70%** Lines (thực đo: **86.59%**).
3. **Automation Rate:** **>= 70%** số test case trong ma trận RTM được tự động hoá (xem chi tiết tại [TEST_CASES_RTM.md](./TEST_CASES_RTM.md)).
4. **Hiệu năng phi chức năng:** `p95 <= 1000 ms` ở tải đồng thời 10 VUs cho API đọc công khai, `0` lỗi `5xx`.
5. **Defect Gate:** **0 defect mức Blocker/Critical** còn ở trạng thái `Open`.

---

## 5. Tổng hợp kết quả kiểm chứng thực tế

| Hạng mục | Lệnh chạy | Kết quả đo thực tế | Báo cáo / Artifact |
|---|---|---|---|
| **Backend Unit & Controller** | `cd backend && npm run test:cov` | **69/69 suites, 656/656 tests PASS** (`17.447 s`) · **76.10% Lines** (`4777/6277`) | `backend/coverage/coverage-summary.json`, `backend/coverage/lcov.info` |
| **Backend API Integration** | `cd backend && npm run test:e2e:prepare && npm run test:e2e` | **12/12 suites, 107/107 tests PASS** (`55.656 s`, exit `0`) | Output Jest 12 suite E2E |
| **Frontend Unit & Component** | `cd frontend && npm run test:cov` | **10/10 files, 48/48 tests PASS** (`10.89 s`) · **86.59% Lines** (`1808/2088`) | `frontend/coverage/coverage-summary.json` |
| **Frontend Selenium UI E2E** | `cd frontend && python -m pytest tests/e2e -v` | **9/9 tests PASS** (`61.89 s`, Chrome Headless) | `frontend/tests/e2e/test_smoke_journeys.py` |
| **Load & Rate-limit Smoke** | `node backend/test/perf/load-smoke.mjs` | **4/4 kịch bản PASS** (`p95`: `60.29–86.82 ms`, `RPS`: `180.07–223.57`, `5xx`: `0`) | `backend/coverage/perf-report.json` |
| **Tổng test case tự động đã chạy** | Tổng 5 tầng | **824 test cases/kịch bản (PASS 100%)** | — |
