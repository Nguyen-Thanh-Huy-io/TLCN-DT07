/**
 * Điền Person.roles từ Person.occupation (chữ tự do) theo bảng ánh xạ cố định.
 * Chỉ xử lý nhân vật chưa có roles nên chạy lại nhiều lần vẫn an toàn.
 * Chạy: npx ts-node prisma/backfill-person-roles.ts
 */
import 'dotenv/config';
import { FigureRole, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const OCCUPATION_TO_ROLE: Record<string, FigureRole> = {
  vua: FigureRole.MONARCH,
  'hoàng đế': FigureRole.MONARCH,
  'quân chủ': FigureRole.MONARCH,
  'nữ vương': FigureRole.MONARCH,
  'vua trong truyền thuyết': FigureRole.MONARCH,
  'tướng lĩnh': FigureRole.GENERAL,
  'nữ tướng theo truyền thuyết': FigureRole.GENERAL,
  'thiền sư': FigureRole.SCHOLAR,
  'lãnh tụ khởi nghĩa': FigureRole.REVOLUTIONARY,
  'thủ lĩnh khởi nghĩa': FigureRole.REVOLUTIONARY,
  'thừa tướng': FigureRole.POLITICIAN,
  'quan lại': FigureRole.POLITICIAN,
  'thái thú': FigureRole.POLITICIAN,
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
