/**
 * Seed tài khoản nhân sự: Editor (MODERATOR), Reviewer (ADMIN), SuperAdmin (SUPERADMIN)
 * Chạy lệnh:
 *   npx ts-node prisma/seeds/staff.seed.ts
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

export const SEEDED_ACCOUNTS = [
  {
    email: 'editor@hisgo.edu.vn',
    username: 'editor',
    role: UserRole.MODERATOR,
    passwordPlain: 'Hisgo@Editor2026',
    firstName: 'Biên Tập',
    lastName: 'Viên',
    bio: 'Biên tập viên nội dung kiến thức và sử liệu HISGO.',
  },
  {
    email: 'reviewer@hisgo.edu.vn',
    username: 'reviewer',
    role: UserRole.ADMIN,
    passwordPlain: 'Hisgo@Reviewer2026',
    firstName: 'Kiểm Duyệt',
    lastName: 'Viên',
    bio: 'Chuyên gia thẩm định và kiểm duyệt nội dung lịch sử HISGO.',
  },
  {
    email: 'superadmin@hisgo.edu.vn',
    username: 'superadmin',
    role: UserRole.SUPERADMIN,
    passwordPlain: 'Hisgo@SuperAdmin2026',
    firstName: 'Quản Trị',
    lastName: 'Tối Cao',
    bio: 'Quản trị viên toàn quyền hệ thống nền tảng HISGO.',
  },
];

async function main() {
  console.log('=== Khởi tạo / Cập nhật 3 tài khoản: Editor, Reviewer, SuperAdmin ===\n');

  for (const acc of SEEDED_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.passwordPlain, 10);

    const user = await prisma.authUser.upsert({
      where: { email: acc.email },
      update: {
        username: acc.username,
        password: passwordHash,
        role: acc.role,
        verified: true,
        status: UserStatus.ACTIVE,
        provider: 'local',
        tokenVersion: { increment: 1 },
      },
      create: {
        email: acc.email,
        username: acc.username,
        password: passwordHash,
        role: acc.role,
        verified: true,
        status: UserStatus.ACTIVE,
        provider: 'local',
        tokenVersion: 1,
      },
    });

    // Cập nhật Profile
    await prisma.userProfile.upsert({
      where: { authId: user.id },
      update: {
        firstName: acc.firstName,
        lastName: acc.lastName,
        bio: acc.bio,
      },
      create: {
        authId: user.id,
        firstName: acc.firstName,
        lastName: acc.lastName,
        bio: acc.bio,
      },
    });

    // Cập nhật AuthSecurity
    await prisma.authSecurity.upsert({
      where: { authId: user.id },
      update: {
        failedAttempts: 0,
        lockExpiresAt: null,
      },
      create: {
        authId: user.id,
        failedAttempts: 0,
        mfaEnabled: false,
      },
    });

    console.log(`[OK] [${acc.role}] Email: ${acc.email} | Username: ${acc.username} | Password: ${acc.passwordPlain}`);
  }

  // Đồng thời đảm bảo tài khoản admin@hisgo.edu.vn cũ (nếu có) cũng được nâng lên SUPERADMIN
  const adminOld = await prisma.authUser.findUnique({
    where: { email: 'admin@hisgo.edu.vn' },
  });
  if (adminOld) {
    await prisma.authUser.update({
      where: { id: adminOld.id },
      data: { role: UserRole.SUPERADMIN },
    });
    console.log('\n[INFO] Đã đồng bộ quyền SUPERADMIN cho tài khoản gốc: admin@hisgo.edu.vn');
  }

  console.log('\n=== Hoàn tất seed tài khoản thành công ===');
}

main()
  .catch((error) => {
    console.error('Lỗi khi seed tài khoản:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
