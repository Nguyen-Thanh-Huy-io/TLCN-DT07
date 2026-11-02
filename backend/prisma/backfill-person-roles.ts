/**
 * Điền Person.roles từ Person.occupation (chữ tự do) theo bảng ánh xạ cố định.
 * Chỉ xử lý nhân vật chưa có roles nên chạy lại nhiều lần vẫn an toàn.
 * Chạy: npx ts-node prisma/backfill-person-roles.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Mã vai trò khớp TaxonomyTerm nhóm FIGURE_ROLE (trước đây là enum FigureRole — đã xoá
// khỏi schema 2026-11-03 vì chỉ còn mỗi script này dùng, trong khi API sống đã chuyển
// hẳn sang Taxonomy từ lâu, trigger DB tự gắn roleIds theo đúng các mã này).
const OCCUPATION_TO_ROLE: Record<string, string> = {
  vua: 'MONARCH',
  'hoàng đế': 'MONARCH',
  'quân chủ': 'MONARCH',
  'nữ vương': 'MONARCH',
  'vua trong truyền thuyết': 'MONARCH',
  'tướng lĩnh': 'GENERAL',
  'nữ tướng theo truyền thuyết': 'GENERAL',
  'thiền sư': 'SCHOLAR',
  'lãnh tụ khởi nghĩa': 'REVOLUTIONARY',
  'thủ lĩnh khởi nghĩa': 'REVOLUTIONARY',
  'thừa tướng': 'POLITICIAN',
  'quan lại': 'POLITICIAN',
  'thái thú': 'POLITICIAN',
};

async function main() {
  const persons = await prisma.person.findMany({
    where: { roles: { isEmpty: true }, occupation: { not: null } },
    include: { entity: { select: { name: true } } },
  });

  for (const person of persons) {
    const tokens = (person.occupation ?? '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const roles = [...new Set(tokens.map((t) => OCCUPATION_TO_ROLE[t]).filter(Boolean))];
    const unmapped = tokens.filter((t) => !OCCUPATION_TO_ROLE[t]);

    if (roles.length > 0) {
      await prisma.person.update({ where: { entityId: person.entityId }, data: { roles } });
    }
    console.log(
      `${person.entity.name.padEnd(28)} | ${person.occupation} -> [${roles.join(', ')}]` +
        (unmapped.length ? `  (bỏ qua: ${unmapped.join(', ')})` : ''),
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
