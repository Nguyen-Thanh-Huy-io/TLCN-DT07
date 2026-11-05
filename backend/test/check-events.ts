import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const events = await prisma.historicalEntity.findMany({
    where: { type: 'EVENT' },
    select: {
      id: true,
      name: true,
      slug: true,
      periodId: true,
      period: { select: { slug: true, name: true } },
    },
    orderBy: { startYear: 'asc' },
  });

  console.log(`\n=== TỔNG SỐ SỰ KIỆN HIỆN CÓ: ${events.length} ===`);
  for (const e of events) {
    console.log(`- [${e.slug}] "${e.name}" | Period: ${e.period?.name || 'CHƯA GẮN'} (${e.period?.slug || 'NULL'})`);
  }

  const allEntities = await prisma.historicalEntity.findMany({
    select: {
      type: true,
    },
  });
  const typeCounts: Record<string, number> = {};
  for (const e of allEntities) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }
  console.log('\n=== TỔNG SỐ THỰC THỂ THEO LOẠI: ===', typeCounts);
}

main().finally(() => prisma.$disconnect());
