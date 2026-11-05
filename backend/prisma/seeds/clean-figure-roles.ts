import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const FIGURE_ROLE_TERMS = [
  {
    code: 'MONARCH',
    label: 'Quân chủ / Hoàng tộc',
    description: 'Vua, Hoàng đế, Hoàng thái hậu, Vương tôn quý tộc, Quân vương',
    displayOrder: 1,
    aliases: ['vua', 'hoàng đế', 'quân chủ', 'nữ vương', 'hoàng tộc', 'vương triều'],
  },
  {
    code: 'GENERAL',
    label: 'Tướng lĩnh / Chỉ huy quân sự',
    description: 'Danh tướng, thống soái, chỉ huy quân sự, võ tướng',
    displayOrder: 2,
    aliases: ['COMMANDER', 'tướng lĩnh', 'danh tướng', 'chỉ huy', 'võ tướng', 'đô đốc'],
  },
  {
    code: 'STRATEGIST',
    label: 'Quân sư / Chiến lược gia',
    description: 'Người hoạch định kế sách, cố vấn quân sự, mưu sĩ chiến lược',
    displayOrder: 3,
    aliases: ['MILITARY_ADVISER', 'quân sư', 'chiến lược gia', 'mưu sĩ', 'cố vấn quân sự'],
  },
  {
    code: 'POLITICIAN',
    label: 'Chính khách / Đại thần',
    description: 'Quan lại triều đình, tể tướng, đại thần, nhà hoạt động chính trị',
    displayOrder: 4,
    aliases: ['STATESMAN', 'quan lại', 'đại thần', 'thừa tướng', 'triều thần', 'chính trị gia'],
  },
  {
    code: 'SCHOLAR',
    label: 'Học giả / Danh sĩ',
    description: 'Học giả, nhà giáo, danh sĩ, trí thức, nhà sử học',
    displayOrder: 5,
    aliases: ['học giả', 'danh sĩ', 'nhà nho', 'nhà giáo', 'trí thức', 'sử gia'],
  },
  {
    code: 'DIPLOMAT',
    label: 'Nhà ngoại giao / Sứ thần',
    description: 'Sứ thần, nhà ngoại giao phụ trách bang giao',
    displayOrder: 6,
    aliases: ['sứ thần', 'ngoại giao', 'đại diện ngoại giao', 'bang giao'],
  },
  {
    code: 'REVOLUTIONARY',
    label: 'Lãnh tụ khởi nghĩa / Phong trào',
    description: 'Thủ lĩnh phong trào khởi nghĩa, nhà cách mạng giải phóng dân tộc',
    displayOrder: 7,
    aliases: ['lãnh tụ khởi nghĩa', 'thủ lĩnh', 'nhà cách mạng', 'thủ lĩnh phong trào'],
  },
  {
    code: 'CULTURAL_FIGURE',
    label: 'Danh nhân văn hóa / Tác gia',
    description: 'Nhà văn, thi hào, tác giả trước tác, danh nhân văn hóa',
    displayOrder: 8,
    aliases: ['nhà văn hóa', 'tác gia', 'thi hào', 'văn sĩ', 'danh nhân văn hóa'],
  },
  {
    code: 'RELIGIOUS_FIGURE',
    label: 'Nhân vật tôn giáo / Thiền sư',
    description: 'Thiền sư, tu sĩ, nhà tư tưởng tôn giáo, cao tăng',
    displayOrder: 9,
    aliases: ['thiền sư', 'tu sĩ', 'tăng thống', 'nhân vật tôn giáo'],
  },
];

async function main() {
  console.log('=== 1. TẠO HOẶC CẬP NHẬT TAXONOMY GROUP: FIGURE_ROLE ===');
  await prisma.taxonomyGroup.upsert({
    where: { code: 'FIGURE_ROLE' },
    create: {
      code: 'FIGURE_ROLE',
      label: 'Vai trò nhân vật',
      description: 'Vai trò khái quát của nhân vật lịch sử (danh nhân). Một nhân vật có thể có nhiều vai trò.',
      multiValued: true,
      hierarchical: false,
      displayOrder: 3,
    },
    update: {
      label: 'Vai trò nhân vật',
      description: 'Vai trò khái quát của nhân vật lịch sử (danh nhân). Một nhân vật có thể có nhiều vai trò.',
      multiValued: true,
      displayOrder: 3,
    },
  });

  console.log('=== 2. UPSERT 9 TERMS CHUẨN HÓA CHO FIGURE_ROLE ===');
  for (const term of FIGURE_ROLE_TERMS) {
    await prisma.taxonomyTerm.upsert({
      where: {
        groupCode_code: {
          groupCode: 'FIGURE_ROLE',
          code: term.code,
        },
      },
      create: {
        groupCode: 'FIGURE_ROLE',
        code: term.code,
        label: term.label,
        description: term.description,
        displayOrder: term.displayOrder,
        aliases: term.aliases,
        isActive: true,
      },
      update: {
        label: term.label,
        description: term.description,
        displayOrder: term.displayOrder,
        aliases: term.aliases,
        isActive: true,
      },
    });
    console.log(`  ✓ Đã nạp vai trò: [${term.code}] - ${term.label}`);
  }

  console.log('\n=== 3. LÀM SẠCH VÀ CHUẨN HÓA PERSON.ROLES HIỆN CÓ ===');
  const persons = await prisma.person.findMany({
    include: { entity: { select: { name: true } } },
  });

  for (const p of persons) {
    let updatedRoles = [...p.roles];
    const name = p.entity.name;

    // Chuyển đổi OPPONENT thành GENERAL hoặc MONARCH khách quan
    if (name.includes('Thoát Hoan')) {
      // Thoát Hoan là Trấn Nam Vương (Hoàng tử con Hốt Tất Liệt) và Tướng lĩnh tổng chỉ huy
      updatedRoles = ['MONARCH', 'GENERAL'];
    } else if (name.includes('Ô Mã Nhi') || name.includes('Phàn Tiếp')) {
      // Ô Mã Nhi, Phàn Tiếp là võ tướng chỉ huy thủy lục quân Nguyên
      updatedRoles = ['GENERAL'];
    } else {
      // Map các alias: COMMANDER -> GENERAL, STRATEGIST -> STRATEGIST
      updatedRoles = updatedRoles.map((r) => {
        if (r === 'COMMANDER') return 'GENERAL';
        if (r === 'OPPONENT') return 'GENERAL';
        return r;
      });
      // Nếu là Trần Nhân Tông, bổ sung RELIGIOUS_FIGURE (Phật Hoàng)
      if (name.includes('Trần Nhân Tông') && !updatedRoles.includes('RELIGIOUS_FIGURE')) {
        updatedRoles.push('RELIGIOUS_FIGURE');
      }
      // Nếu là Trần Hưng Đạo, đảm bảo có GENERAL và STRATEGIST
      if (name.includes('Trần Hưng Đạo')) {
        updatedRoles = ['GENERAL', 'STRATEGIST'];
      }
    }

    // Lọc trùng và chỉ lấy các role có trong danh mục FIGURE_ROLE
    const validCodes = new Set(FIGURE_ROLE_TERMS.map((t) => t.code));
    updatedRoles = [...new Set(updatedRoles.filter((r) => validCodes.has(r)))];

    await prisma.person.update({
      where: { entityId: p.entityId },
      data: { roles: updatedRoles },
    });

    console.log(`  ✓ ${name.padEnd(35)} -> Roles: [${updatedRoles.join(', ')}]`);
  }

  // Chạy lại update trigger để đồng bộ role_ids
  console.log('\n=== 4. ĐỒNG BỘ TRIGGER ROLE_IDS TỪ TAXONOMY_TERMS (FIGURE_ROLE) ===');
  await prisma.$executeRawUnsafe(`
    UPDATE "persons" p SET "role_ids" = ARRAY(
      SELECT t."id" FROM unnest(p."roles") WITH ORDINALITY AS r(code, ord)
      JOIN "taxonomy_terms" t ON t."group_code" = 'FIGURE_ROLE' AND t."code" = r.code
      ORDER BY r.ord
    );
  `);

  console.log('  ✓ Đã cập nhật xong role_ids tự động theo FIGURE_ROLE.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
