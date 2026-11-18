import { PrismaService } from '../common/services/prisma.service';

/** Bản ghi cũ chưa lưu người tạo. */
export const UNKNOWN_AUTHOR = '—';

/** Tên hiển thị (Họ Tên, không có thì username) của các tài khoản, một truy vấn cho cả danh sách. */
export async function loadAuthorNames(
  prisma: PrismaService,
  ids: (string | null | undefined)[],
): Promise<(id: string | null | undefined) => string> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const users = unique.length
    ? await prisma.authUser.findMany({
        where: { id: { in: unique } },
        select: {
          id: true,
          username: true,
          userProfile: { select: { firstName: true, lastName: true } },
        },
      })
    : [];
  const names = new Map(
    users.map((u) => {
      const full = [u.userProfile?.lastName, u.userProfile?.firstName]
        .filter(Boolean)
        .join(' ');
      return [u.id, full || u.username];
    }),
  );
  return (id) => (id && names.get(id)) || UNKNOWN_AUTHOR;
}
