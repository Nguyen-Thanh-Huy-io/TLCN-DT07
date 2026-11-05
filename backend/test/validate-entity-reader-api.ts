import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { LandingContentFacade } from '../src/public-content/landing-content.facade';
import { LandingSectionRegistry } from '../src/public-content/strategies/landing-section.registry';
import { NotFoundException } from '@nestjs/common';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
  const prisma = new PrismaClient({ adapter });
  const mockRedis: any = {
    get: async () => null,
    set: async () => {},
    del: async () => {},
  };
  const mockRegistry: any = new LandingSectionRegistry([]);
  const facade = new LandingContentFacade(prisma as any, mockRedis, mockRegistry);

  console.log('=== TEST 1: Chi tiết Triều đại Nhà Lý (nha-ly) ===');
  const nhaLy = await facade.getEntityBySlug('nha-ly');
  console.assert(nhaLy.slug === 'nha-ly', 'Slug phải là nha-ly');
  console.assert(nhaLy.type === 'DYNASTY', 'Type phải là DYNASTY');
  console.assert(nhaLy.name.includes('Nhà Lý'), 'Tên phải là Nhà Lý');
  console.assert(Array.isArray(nhaLy.contentBlocks), 'contentBlocks phải là array');
  const blocks = nhaLy.contentBlocks as any[];
  console.assert(blocks.length >= 8, `Số lượng block phải >= 8 (hiện tại: ${blocks.length})`);
  console.log(`✓ Nhà Lý: OK (${blocks.length} blocks, type=${nhaLy.type}, period=${nhaLy.period?.name})`);

  console.log('=== TEST 2: Chi tiết Cổ vật Bãi cọc Bạch Đằng (bai-coc-bach-dang) ===');
  const baiCoc = await facade.getEntityBySlug('bai-coc-bach-dang');
  console.assert(baiCoc.slug === 'bai-coc-bach-dang', 'Slug phải là bai-coc-bach-dang');
  console.assert(baiCoc.type === 'ARTIFACT', 'Type phải là ARTIFACT');
  console.assert(baiCoc.name.includes('Bãi cọc'), 'Tên phải chứa Bãi cọc');
  console.log(`✓ Bãi cọc: OK (type=${baiCoc.type}, statements count=${baiCoc.statements.length})`);

  console.log('=== TEST 3: Kiểm tra lỗi 404 cho slug không tồn tại ===');
  let notFoundCaught = false;
  try {
    await facade.getEntityBySlug('thuc-the-ao-khong-ton-tai-9999');
  } catch (err) {
    if (err instanceof NotFoundException) {
      notFoundCaught = true;
    }
  }
  console.assert(notFoundCaught, 'Phải ném NotFoundException khi slug không tồn tại');
  console.log('✓ NotFoundException: OK');

  console.log('\n========================================');
  console.log('TẤT CẢ TEST BACKEND CHO ENTITY READER ĐÃ VƯỢT QUA!');
  console.log('========================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
