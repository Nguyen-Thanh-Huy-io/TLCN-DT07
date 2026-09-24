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
npx prisma migrate dev
npm run start:dev
```

* Swagger API Docs: `http://localhost:5000/docs`
