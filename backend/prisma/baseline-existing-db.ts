/**
 * Chuyển một DB đã có dữ liệu sang lịch sử migration baseline (chạy 1 lần trên mỗi máy):
 *   npm run db:baseline
 *
 * Ngày 2026-11-14 toàn bộ 67 migration cũ được gộp thành 1 migration baseline sinh từ `prisma/schema`,
 * vì lịch sử cũ không dựng được DB trống (bảng tạo bằng db push, giá trị enum dùng trong cùng transaction).
 * DB đã chạy lịch sử cũ thì cấu trúc đã đúng — chỉ cần đổi sổ `_prisma_migrations`:
 *   1. Kiểm DB khớp `prisma/schema` (lệch thì dừng, không đụng gì).
 *   2. Xoá các dòng migration không còn trong `prisma/migrations` (lịch sử cũ, lần deploy hỏng).
 *   3. Đánh dấu các migration hiện có là đã áp dụng (`prisma migrate resolve --applied`).
 * Dữ liệu các bảng không bị đụng tới.
 */
import 'dotenv/config';
import { execSync, spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const MIGRATIONS_DIR = join(__dirname, 'migrations');
const SCHEMA_DIFF_EXIT_CODE_CHANGED = 2;

const localMigrations = (): string[] =>
  readdirSync(MIGRATIONS_DIR)
    .filter((name) => statSync(join(MIGRATIONS_DIR, name)).isDirectory())
    .sort();

function assertDatabaseMatchesSchema() {
  const diff = spawnSync(
    'npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --exit-code',
    { shell: true, stdio: 'ignore', env: process.env },
  );
  if (diff.status === SCHEMA_DIFF_EXIT_CODE_CHANGED) {
    throw new Error(
      'DB đang lệch prisma/schema — dừng, chưa đổi gì. Xem lệch bằng: ' +
        'npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --script',
    );
  }
  if (diff.status !== 0) {
    throw new Error(
      'Không so sánh được DB với prisma/schema (prisma migrate diff lỗi).',
    );
  }
}

async function main() {
  const migrations = localMigrations();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const table = await client.query(
      "SELECT to_regclass('public._prisma_migrations') AS name",
    );
    if (!table.rows[0]?.name) {
      console.log(
        'DB chưa có bảng _prisma_migrations — DB mới thì chỉ cần: npx prisma migrate deploy',
      );
      return;
    }

    assertDatabaseMatchesSchema();

    const removed = await client.query(
      `DELETE FROM "_prisma_migrations"
        WHERE NOT (migration_name = ANY($1))
           OR finished_at IS NULL
           OR rolled_back_at IS NOT NULL`,
      [migrations],
    );
    console.log(`Đã bỏ ${removed.rowCount} dòng migration cũ / hỏng khỏi sổ.`);

    const applied = await client.query(
      'SELECT migration_name FROM "_prisma_migrations"',
    );
    const appliedNames = new Set(
      applied.rows.map((row: { migration_name: string }) => row.migration_name),
    );
    for (const name of migrations.filter((m) => !appliedNames.has(m))) {
      execSync(`npx prisma migrate resolve --applied ${name}`, {
        stdio: 'inherit',
        env: process.env,
      });
    }
  } finally {
    await client.end();
  }
  execSync('npx prisma migrate status', { stdio: 'inherit', env: process.env });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
