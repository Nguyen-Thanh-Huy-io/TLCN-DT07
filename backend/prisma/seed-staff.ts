/**
 * Seed tài khoản nhân sự cho quy trình biên soạn → duyệt (chạy được nhiều lần):
 *   npx ts-node prisma/seed-staff.ts
 *
 *  - Nâng tài khoản quản trị gốc (SEED_SUPERADMIN_EMAIL) lên SUPERADMIN.
 *  - Tạo 1 biên tập viên (MODERATOR), 1 người duyệt (ADMIN) và 1 người học (USER) cho môi trường dev/test.
 *
 * Mật khẩu tài khoản test lấy từ SEED_STAFF_PASSWORD; giá trị mặc định bên dưới CHỈ dùng
 * cho máy dev — đổi trước khi chạy trên môi trường thật.
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

const SUPERADMIN_EMAIL =
  process.env.SEED_SUPERADMIN_EMAIL || 'admin@hisgo.edu.vn';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'Hisgo@Staff2026';

const TEST_STAFF = [
  {
    email: 'editor@hisgo.test',
    username: 'bien_tap_vien',
    role: UserRole.MODERATOR,
  },
  {
    email: 'reviewer@hisgo.test',
    username: 'nguoi_duyet',
    role: UserRole.ADMIN,
  },
  // Người học thường — để thử phân quyền (bị chặn khỏi CMS) và luồng đăng ký lộ trình.
  {
    email: 'learner@hisgo.test',
    username: 'nguoi_hoc_test',
    role: UserRole.USER,
  },
];

async function main() {
  const promoted = await prisma.authUser.updateMany({
    where: { email: SUPERADMIN_EMAIL },
    // tokenVersion tăng để phiên cũ (mang role ADMIN trong token) phải đăng nhập lại.
    data: { role: UserRole.SUPERADMIN, tokenVersion: { increment: 1 } },
  });
  console.log(
    `SUPERADMIN ${SUPERADMIN_EMAIL}: ${promoted.count ? 'đã nâng quyền' : 'không tìm thấy'}`,
  );

  const password = await bcrypt.hash(STAFF_PASSWORD, 10);
  for (const staff of TEST_STAFF) {
    await prisma.authUser.upsert({
      where: { email: staff.email },
      update: { role: staff.role },
      create: { ...staff, password, verified: true },
    });
    console.log(`${staff.role} ${staff.email}: sẵn sàng`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
