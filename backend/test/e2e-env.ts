import 'dotenv/config';

/**
 * Môi trường cho test e2e: DB và Redis tách khỏi môi trường dev.
 * Test e2e nạp nguyên AppModule và xoá dữ liệu (deleteMany), nên tuyệt đối không được chạy lên DB dev;
 * BullMQ worker cũng chạy theo, nên Redis phải khác DB/tiền tố để không lấy mất job của backend dev.
 */
const E2E_DATABASE_SUFFIX = '_e2e';
const DEFAULT_E2E_REDIS_DB = '1';
const E2E_REDIS_KEY_PREFIX = 'e2e';
const APPLIED_MARKER = 'HISGO_E2E_ENV_APPLIED';
const DATABASE_NAME_PATTERN = /^[a-z0-9_]+$/;

export interface E2eDatabaseTarget {
  url: string;
  databaseName: string;
}

const databaseNameOf = (url: URL): string =>
  decodeURIComponent(url.pathname.replace(/^\//, ''));

/** DB e2e = `E2E_DATABASE_URL`, hoặc DB dev cộng hậu tố `_e2e`. Không bao giờ trùng DB dev. */
export function resolveE2eDatabase(): E2eDatabaseTarget {
  const devUrl = process.env.DATABASE_URL;
  const explicitUrl = process.env.E2E_DATABASE_URL;
  if (!devUrl && !explicitUrl) {
    throw new Error(
      'Thiếu DATABASE_URL (hoặc E2E_DATABASE_URL) để dựng DB e2e.',
    );
  }

  const target = new URL(explicitUrl ?? `${devUrl}`);
  if (!explicitUrl) {
    target.pathname = `/${databaseNameOf(target)}${E2E_DATABASE_SUFFIX}`;
  }

  const databaseName = databaseNameOf(target);
  if (!DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new Error(`Tên DB e2e không hợp lệ: "${databaseName}"`);
  }
  if (devUrl && databaseName === databaseNameOf(new URL(devUrl))) {
    throw new Error(
      'DB e2e trùng DB dev — dừng để không xoá dữ liệu thật. Đặt E2E_DATABASE_URL khác.',
    );
  }
  return { url: target.toString(), databaseName };
}

/** Gọi trước khi nạp AppModule. Chạy nhiều lần trong cùng tiến trình vẫn an toàn. */
export function applyE2eEnv(): E2eDatabaseTarget {
  if (process.env[APPLIED_MARKER]) {
    return {
      url: `${process.env.DATABASE_URL}`,
      databaseName: databaseNameOf(new URL(`${process.env.DATABASE_URL}`)),
    };
  }
  const target = resolveE2eDatabase();
  process.env.DATABASE_URL = target.url;
  process.env.REDIS_DB = process.env.E2E_REDIS_DB ?? DEFAULT_E2E_REDIS_DB;
  process.env.REDIS_CACHE_KEY_PREFIX = E2E_REDIS_KEY_PREFIX;
  process.env[APPLIED_MARKER] = '1';
  return target;
}
