import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@hisgo.edu.vn';
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Hisgo@Admin2026';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.authUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      username: ADMIN_USERNAME,
      password: passwordHash,
      role: UserRole.SUPERADMIN,
      verified: true,
      status: UserStatus.ACTIVE,
      provider: 'local',
      tokenVersion: { increment: 1 },
    },
    create: {
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: passwordHash,
      role: UserRole.SUPERADMIN,
      verified: true,
      status: UserStatus.ACTIVE,
      provider: 'local',
      tokenVersion: 1,
    },
  });

  console.log('=== Admin seed created/updated ===');
  console.log(JSON.stringify(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      password: ADMIN_PASSWORD,
      loginUrl: '/auth/login',
    },
    null,
    2,
  ));
}

main()
  .catch((error) => {
    console.error('Admin seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
