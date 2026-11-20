import { PrismaService } from '../services/prisma.service';

/** Bản ghi cũ chưa lưu người tạo. */
export const UNKNOWN_AUTHOR = '—';

export interface PublicAuthorSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

function formatAuthorDisplayName(user: {
  username: string;
  userProfile?: { firstName: string | null; lastName: string | null } | null;
}): string {
  const full = [user.userProfile?.lastName, user.userProfile?.firstName]
    .filter(Boolean)
    .join(' ');
  return full || user.username;
}

/**
 * Tải thông tin hiển thị công khai của danh sách tác giả trong 1 truy vấn duy nhất.
 * Trả `null` nếu không có ID hợp lệ hoặc người dùng không còn tồn tại.
 */
export async function loadAuthorProfiles(
  prisma: PrismaService,
  ids: (string | null | undefined)[],
): Promise<(id: string | null | undefined) => PublicAuthorSummary | null> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) {
    return () => null;
  }

  const users = await prisma.authUser.findMany({
    where: { id: { in: unique }, deletedAt: null },
    select: {
      id: true,
      username: true,
      userProfile: {
        select: { firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });

  const profiles = new Map<string, PublicAuthorSummary>(
    users.map((u) => [
      u.id,
      {
        id: u.id,
        username: u.username,
        displayName: formatAuthorDisplayName(u),
        avatarUrl: u.userProfile?.avatarUrl ?? null,
      },
    ]),
  );

  return (id) => (id && profiles.get(id)) || null;
}

/** Tên hiển thị (Họ Tên, không có thì username) của các tài khoản, một truy vấn cho cả danh sách. */
export async function loadAuthorNames(
  prisma: PrismaService,
  ids: (string | null | undefined)[],
): Promise<(id: string | null | undefined) => string> {
  const profileOf = await loadAuthorProfiles(prisma, ids);
  return (id) => profileOf(id)?.displayName || UNKNOWN_AUTHOR;
}
