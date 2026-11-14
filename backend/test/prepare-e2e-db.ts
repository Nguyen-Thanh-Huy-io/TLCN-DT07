/**
 * Dựng lại DB e2e từ đầu: xoá DB e2e cũ, tạo mới, rồi áp toàn bộ `prisma/migrations` (như máy mới / CI).
 * Chạy: npm run test:e2e:prepare
 * Không đụng DB dev: tên DB lấy từ `resolveE2eDatabase()`, vốn từ chối trùng DB dev.
 */
import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { applyE2eEnv } from './e2e-env';

const MAINTENANCE_DATABASE = 'postgres';

async function recreateDatabase(url: string, databaseName: string) {
  const maintenanceUrl = new URL(url);
  maintenanceUrl.pathname = `/${MAINTENANCE_DATABASE}`;
  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  try {
    // Tên DB đã được kiểm theo mẫu [a-z0-9_] trong resolveE2eDatabase nên ghép vào câu lệnh an toàn.
    await client.query(
      `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
    );
    await client.query(`CREATE DATABASE "${databaseName}"`);
    console.log(`Đã tạo lại DB e2e "${databaseName}".`);
  } finally {
    await client.end();
  }
}

async function main() {
  const target = applyE2eEnv();
  await recreateDatabase(target.url, target.databaseName);
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
  console.log('DB e2e sẵn sàng.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
