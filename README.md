# TLCN-DT07

Hệ thống phục vụ Tiểu luận chuyên ngành / Đề tài DT07.

## Cấu trúc thư mục

```text
TLCN-DT07/
├── backend/          # NestJS Backend API + Prisma ORM + PostgreSQL + Redis
│   ├── src/          # Source code backend (Modules, Controllers, Services)
│   ├── prisma/       # Prisma schemas & migrations
│   ├── docker-compose.yaml  # Hạ tầng PostgreSQL & Redis gọn nhẹ
│   └── .env.example  # File mẫu biến môi trường backend
├── docs/             # Tài liệu thiết kế, Sequence Diagrams, Specs
└── .gitignore
```

## Hướng dẫn khởi động Backend

### 1. Khởi động PostgreSQL & Redis (Docker)
```bash
cd backend
docker compose up -d
```
* **PostgreSQL**: Chạy tại cổng `5433` (database: `tlcn_db`, user: `admin`, pass: `admin`)
* **Redis**: Chạy tại cổng `6379`
* **pgAdmin**: Chạy tại cổng `8080` (truy cập `http://localhost:8080`, email: `admin@example.com`, pass: `admin`)

### 2. Cài đặt dependencies & Chạy Backend
```bash
cd backend
npm install
npx prisma migrate deploy   # DB có dữ liệu từ trước 2026-11-14: chạy `npm run db:baseline` một lần thay vì lệnh này
npm run start:dev
```

> **Lịch sử migration đã gộp thành 1 baseline (2026-11-14).** 67 migration cũ không dựng được DB trống nên đã thay bằng `prisma/migrations/20261114000000_baseline` (sinh từ `prisma/schema`).
> * Máy mới / DB trống: `npx prisma migrate deploy`.
> * DB đã có dữ liệu từ trước ngày đó: chạy **một lần** `npm run db:baseline` (kiểm DB khớp schema, dọn sổ `_prisma_migrations`, đánh dấu baseline đã áp dụng — không đụng dữ liệu). Đừng chạy `migrate deploy` trước bước này: nó sẽ báo `type ... already exists` (không hỏng dữ liệu, chạy `npm run db:baseline` là gỡ được).

* Swagger API Docs: `http://localhost:5000/docs`
