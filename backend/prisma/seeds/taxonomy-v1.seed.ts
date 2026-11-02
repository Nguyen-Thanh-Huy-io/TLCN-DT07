import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

export interface PredicateRuleSpec {
  allowedSubjectTypes: string[];
  allowedObjectTypes: string[];
  isSymmetric: boolean;
  isTransitive: boolean;
  allowedQualifiers: string[];
  isRequiredQualifiers: string[];
}

export interface PredicateTermSpec {
  code: string;
  label: string;
  inverseLabel: string;
  description: string;
  rule: PredicateRuleSpec;
}

export const TAXONOMY_GROUPS_V1 = [
  {
    code: 'EVENT_TYPE',
    label: 'Loại sự kiện',
    description: 'Phân loại các sự kiện lịch sử theo tính chất',
    hierarchical: true,
    displayOrder: 1,
  },
  {
    code: 'PERIOD_TYPE',
    label: 'Loại thời kỳ',
    description: 'Phân loại các giai đoạn, triều đại và thời đại lịch sử',
    hierarchical: false,
    displayOrder: 2,
  },
  {
    code: 'SITE_TYPE',
    label: 'Loại địa điểm lịch sử',
    description: 'Phân loại các địa danh, di tích, di chỉ lịch sử',
    hierarchical: false,
    displayOrder: 3,
  },
  {
    code: 'PREDICATE',
    label: 'Loại quan hệ tri thức',
    description: 'Vị từ mô tả liên kết tri thức (Subject -> Predicate -> Object) trong Knowledge Graph',
    hierarchical: false,
    displayOrder: 4,
  },
  {
    code: 'ROLE_TYPE',
    label: 'Vai trò trong sự kiện',
    description: 'Vai trò của nhân vật / lực lượng khi tham gia sự kiện lịch sử',
    hierarchical: false,
    displayOrder: 5,
  },
  {
    code: 'SOURCE_FORMAT',
    label: 'Hình thức nguồn',
    description: 'Hình thức vật lý hoặc định dạng của tư liệu, nguồn tham khảo',
    hierarchical: false,
    displayOrder: 6,
  },
  {
    code: 'SOURCE_NATURE',
    label: 'Bản chất nguồn',
    description: 'Bản chất học thuật của nguồn (sơ cấp, thứ cấp, truyền khẩu...)',
    hierarchical: false,
    displayOrder: 7,
  },
  {
    code: 'REGION',
    label: 'Quốc gia / khu vực',
    description: 'Phạm vi địa lý của giai đoạn lịch sử — dùng cho bộ lọc Dòng thời gian, Giai đoạn, Nhân vật, Trang chủ.',
    hierarchical: true,
    displayOrder: 8,
  },
];

export const REGION_TYPES = [
  { code: 'VIETNAM', label: 'Việt Nam', aliases: ['việt nam', 'toàn quốc', 'vn'], parentCode: null },
  { code: 'WORLD', label: 'Thế giới', aliases: ['thế giới', 'toàn cầu'], parentCode: null },
  { code: 'SOVIET_UNION', label: 'Liên Xô', aliases: ['liên xô', 'liên bang xô viết'], parentCode: null },
  { code: 'SOUTHEAST_ASIA', label: 'Đông Nam Á', aliases: ['đông nam á'], parentCode: null },
  { code: 'ASIA', label: 'Châu Á', aliases: ['châu á'], parentCode: null },
  { code: 'EUROPE_MEDITERRANEAN', label: 'Châu Âu & Địa Trung Hải', aliases: ['châu âu & địa trung hải'], parentCode: null },
  { code: 'EUROPE_NORTH_AMERICA', label: 'Châu Âu & Bắc Mỹ', aliases: ['châu âu & bắc mỹ'], parentCode: null },
  // Bổ sung cho cụm Pilot "Cách mạng Pháp" — trước đây chỉ có cấp châu lục, không có
  // term riêng cho nước Pháp, buộc Period phải gắn vào EUROPE_MEDITERRANEAN (quá rộng).
  { code: 'FRANCE', label: 'Pháp', aliases: ['pháp', 'france', 'vương quốc pháp'], parentCode: 'EUROPE_MEDITERRANEAN' },
];

export const EVENT_TYPE_CATEGORIES = [
  { code: 'MILITARY_EVENT', label: 'Sự kiện quân sự' },
  { code: 'POLITICAL_EVENT', label: 'Sự kiện chính trị' },
  { code: 'DIPLOMATIC_EVENT', label: 'Sự kiện ngoại giao' },
  { code: 'SOCIAL_EVENT', label: 'Sự kiện xã hội - văn hóa' },
];

export const EVENT_TYPES = [
  { code: 'WAR', label: 'Chiến tranh', parentCode: 'MILITARY_EVENT' },
  { code: 'CAMPAIGN', label: 'Chiến dịch', parentCode: 'MILITARY_EVENT' },
  { code: 'BATTLE', label: 'Trận đánh', parentCode: 'MILITARY_EVENT' },
  { code: 'REVOLUTION', label: 'Cách mạng', parentCode: 'POLITICAL_EVENT' },
  { code: 'UPRISING', label: 'Khởi nghĩa', parentCode: 'POLITICAL_EVENT' },
  { code: 'COUP', label: 'Đảo chính', parentCode: 'POLITICAL_EVENT' },
  { code: 'FOUNDATION', label: 'Thành lập', parentCode: 'POLITICAL_EVENT' },
  { code: 'POLITICAL_TRANSITION', label: 'Chuyển đổi chính trị', parentCode: 'POLITICAL_EVENT' },
  { code: 'ELECTION', label: 'Bầu cử', parentCode: 'POLITICAL_EVENT' },
  { code: 'TREATY', label: 'Hiệp ước', parentCode: 'DIPLOMATIC_EVENT' },
  { code: 'CONFERENCE', label: 'Hội nghị', parentCode: 'DIPLOMATIC_EVENT' },
  { code: 'DECLARATION', label: 'Tuyên ngôn', parentCode: 'POLITICAL_EVENT' },
  { code: 'REFORM', label: 'Cải cách', parentCode: 'SOCIAL_EVENT' },
  { code: 'ASSASSINATION', label: 'Ám sát', parentCode: 'POLITICAL_EVENT' },
];

export const PERIOD_TYPES = [
  { code: 'HISTORICAL_ERA', label: 'Thời đại lịch sử' },
  { code: 'DYNASTY_PERIOD', label: 'Thời kỳ triều đại' },
  { code: 'REIGN', label: 'Thời kỳ trị vì' },
  { code: 'WAR_PERIOD', label: 'Thời kỳ chiến tranh' },
  { code: 'POLITICAL_REGIME', label: 'Thời kỳ chính thể' },
  { code: 'OCCUPATION_PERIOD', label: 'Thời kỳ chiếm đóng' },
  { code: 'CULTURAL_PERIOD', label: 'Thời kỳ văn hóa' },
  { code: 'TRANSITION_PERIOD', label: 'Thời kỳ chuyển tiếp' },
];

export const SITE_TYPES = [
  { code: 'BATTLEFIELD', label: 'Chiến trường' },
  { code: 'PALACE', label: 'Cung điện' },
  { code: 'CITADEL_FORTRESS', label: 'Thành lũy, pháo đài' },
  { code: 'TEMPLE_SHRINE', label: 'Đền, miếu, lăng tẩm' },
  { code: 'PAGODA_RELIGIOUS', label: 'Chùa, cơ sở tôn giáo' },
  { code: 'COMMEMORATIVE_MONUMENT', label: 'Đài tưởng niệm, tượng đài' },
  { code: 'HEADQUARTERS_BASE', label: 'Trụ sở, căn cứ cách mạng' },
  { code: 'PRISON_DETENTION', label: 'Nhà tù, trại giam' },
  { code: 'HISTORICAL_RESIDENCE', label: 'Nơi ở, di tích lưu niệm' },
  { code: 'ARCHAEOLOGICAL_SITE', label: 'Di chỉ khảo cổ' },
  { code: 'OTHER_SITE', label: 'Di tích khác' },
];

export const PREDICATE_SPECS: PredicateTermSpec[] = [
  {
    code: 'FOUNDED',
    label: 'Sáng lập',
    inverseLabel: 'Được sáng lập bởi',
    description: 'Chỉ hành vi sáng lập một triều đại, nhà nước, tổ chức hoặc địa danh',
    rule: {
      allowedSubjectTypes: ['PERSON', 'ORGANIZATION'],
      allowedObjectTypes: ['DYNASTY', 'ORGANIZATION', 'ORGANIZATION', 'LOCATION'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['year', 'location', 'notes'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'SUCCEEDED_BY',
    label: 'Kế nhiệm bởi',
    inverseLabel: 'Kế nhiệm cho',
    description: 'Người kế vị trong cương vị lãnh đạo hoặc quân chủ',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['PERSON'],
      isSymmetric: false,
      isTransitive: true,
      allowedQualifiers: ['reignStartYear', 'reignEndYear', 'office'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'CHILD_OF',
    label: 'Con của',
    inverseLabel: 'Cha mẹ của',
    description: 'Quan hệ huyết thống hoặc con nuôi',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['PERSON'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['mother', 'father', 'biological', 'adopted'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'PARENT_OF',
    label: 'Cha mẹ của',
    inverseLabel: 'Con của',
    description: 'Quan hệ cha mẹ với con cái',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['PERSON'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['biological', 'adopted'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'SPOUSE_OF',
    label: 'Vợ/chồng của',
    inverseLabel: 'Vợ/chồng của',
    description: 'Hôn nhân lịch sử',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['PERSON'],
      isSymmetric: true,
      isTransitive: false,
      allowedQualifiers: ['marriageYear', 'title'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'ALLY_OF',
    label: 'Đồng minh của',
    inverseLabel: 'Đồng minh của',
    description: 'Quan hệ liên minh quân sự hoặc chính trị',
    rule: {
      allowedSubjectTypes: ['ORGANIZATION', 'ORGANIZATION', 'PERSON', 'DYNASTY'],
      allowedObjectTypes: ['ORGANIZATION', 'ORGANIZATION', 'PERSON', 'DYNASTY'],
      isSymmetric: true,
      isTransitive: false,
      allowedQualifiers: ['context', 'duration', 'treaty'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'OPPONENT_OF',
    label: 'Đối thủ của',
    inverseLabel: 'Đối thủ của',
    description: 'Quan hệ đối kháng chiến trường hoặc chính trị',
    rule: {
      allowedSubjectTypes: ['ORGANIZATION', 'ORGANIZATION', 'PERSON', 'DYNASTY'],
      allowedObjectTypes: ['ORGANIZATION', 'ORGANIZATION', 'PERSON', 'DYNASTY'],
      isSymmetric: true,
      isTransitive: false,
      allowedQualifiers: ['context', 'conflictId'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'PRECEDED_BY',
    label: 'Xảy ra sau',
    inverseLabel: 'Xảy ra trước',
    description: 'Trật tự thời gian giữa hai sự kiện',
    rule: {
      allowedSubjectTypes: ['HISTORICAL_EVENT'],
      allowedObjectTypes: ['HISTORICAL_EVENT'],
      isSymmetric: false,
      isTransitive: true,
      allowedQualifiers: ['gapYears', 'causalLink'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'CAUSED_BY',
    label: 'Gây ra bởi',
    inverseLabel: 'Dẫn tới',
    description: 'Quan hệ nhân quả trực tiếp giữa hai sự kiện',
    rule: {
      allowedSubjectTypes: ['HISTORICAL_EVENT'],
      allowedObjectTypes: ['HISTORICAL_EVENT'],
      isSymmetric: false,
      isTransitive: true,
      allowedQualifiers: ['directness', 'mechanism'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'SUB_EVENT_OF',
    label: 'Là sự kiện con của',
    inverseLabel: 'Bao gồm sự kiện con',
    description: 'Phân cấp sự kiện (trận đánh thuộc chiến dịch, chiến dịch thuộc chiến tranh)',
    rule: {
      allowedSubjectTypes: ['HISTORICAL_EVENT'],
      allowedObjectTypes: ['HISTORICAL_EVENT'],
      isSymmetric: false,
      isTransitive: true,
      allowedQualifiers: ['phase', 'order'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'LOCATED_AT',
    label: 'Diễn ra / Tọa lạc tại',
    inverseLabel: 'Nơi diễn ra',
    description: 'Gắn sự kiện hoặc di tích với vị trí địa lý',
    rule: {
      allowedSubjectTypes: ['HISTORICAL_EVENT', 'LOCATION'],
      allowedObjectTypes: ['LOCATION', 'LOCATION'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['exactLocation', 'notes'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'MEMBER_OF',
    label: 'Thành viên của',
    inverseLabel: 'Có thành viên',
    description: 'Quan hệ thành viên trong tổ chức, phe phái chính trị',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['ORGANIZATION', 'ORGANIZATION'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['role', 'joinYear', 'leaveYear'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'CAPITAL_OF',
    label: 'Thủ đô của',
    inverseLabel: 'Có thủ đô là',
    description: 'Thủ đô của một triều đại hoặc quốc gia',
    rule: {
      allowedSubjectTypes: ['LOCATION', 'LOCATION'],
      allowedObjectTypes: ['DYNASTY', 'ORGANIZATION'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['fromYear', 'toYear'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'AUTHORED',
    label: 'Tác giả của',
    inverseLabel: 'Được sáng tác bởi',
    description: 'Tác giả của tác phẩm, chiếu hịch, văn kiện hoặc hiện vật',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['ARTIFACT', 'LITERAL'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['year', 'genre'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'CONTEMPORARY_OF',
    label: 'Cùng thời với',
    inverseLabel: 'Cùng thời với',
    description: 'Hai nhân vật sống và hoạt động trong cùng thời đại',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['PERSON'],
      isSymmetric: true,
      isTransitive: false,
      allowedQualifiers: ['notes'],
      isRequiredQualifiers: [],
    },
  },
  // --- Bổ sung theo Data Scope v1.0 (02/11/2026) mục 6 — các nhóm quan hệ bắt buộc có
  // để kiểm thử Pilot 3 cụm (Nhà Trần, Cách mạng tháng Tám, Cách mạng Pháp) nhưng chưa
  // có predicate nào mô tả được trước khi bổ sung lần này.
  {
    code: 'PARTICIPATED_IN',
    label: 'Tham gia',
    inverseLabel: 'Có sự tham gia của',
    description: 'Nhân vật hoặc tổ chức tham gia vào một sự kiện lịch sử (không giữ vai trò chỉ huy)',
    rule: {
      allowedSubjectTypes: ['PERSON', 'ORGANIZATION', 'MILITARY_FORCE'],
      allowedObjectTypes: ['HISTORICAL_EVENT'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['role', 'notes'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'COMMANDED',
    label: 'Chỉ huy',
    inverseLabel: 'Được chỉ huy bởi',
    description: 'Nhân vật trực tiếp chỉ huy một lực lượng quân sự hoặc một chiến dịch/trận đánh',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['MILITARY_FORCE', 'HISTORICAL_EVENT'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['role', 'validFromYear', 'validToYear', 'notes'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'RULED',
    label: 'Trị vì',
    inverseLabel: 'Được trị vì bởi',
    description: 'Quân chủ hoặc lãnh đạo trị vì một triều đại/quốc gia trong một khoảng thời gian',
    rule: {
      allowedSubjectTypes: ['PERSON'],
      allowedObjectTypes: ['DYNASTY', 'ORGANIZATION'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['reignStartYear', 'reignEndYear'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'OCCURRED_AT',
    label: 'Diễn ra tại',
    inverseLabel: 'Nơi diễn ra sự kiện',
    description: 'Một sự kiện diễn ra tại một địa điểm/di tích lịch sử cụ thể',
    rule: {
      allowedSubjectTypes: ['HISTORICAL_EVENT'],
      allowedObjectTypes: ['LOCATION'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['exactLocation', 'notes'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'ENDED',
    label: 'Kết thúc bởi',
    inverseLabel: 'Chấm dứt',
    description: 'Một triều đại, tổ chức hoặc chính thể kết thúc do một sự kiện hoặc bị bãi bỏ',
    rule: {
      allowedSubjectTypes: ['DYNASTY', 'ORGANIZATION'],
      allowedObjectTypes: ['HISTORICAL_EVENT'],
      isSymmetric: false,
      isTransitive: false,
      allowedQualifiers: ['year', 'notes'],
      isRequiredQualifiers: [],
    },
  },
  {
    code: 'RELATED_TO',
    label: 'Có liên quan',
    inverseLabel: 'Có liên quan',
    description:
      'Quan hệ chưa xác định được loại cụ thể — CHỈ dùng khi chưa chuẩn hóa được thành predicate rõ nghĩa, không dùng thay cho mọi quan hệ',
    rule: {
      allowedSubjectTypes: [],
      allowedObjectTypes: [],
      isSymmetric: true,
      isTransitive: false,
      allowedQualifiers: ['notes'],
      isRequiredQualifiers: [],
    },
  },
];

export const ROLE_TYPES = [
  { code: 'COMMANDER', label: 'Chỉ huy', aliases: ['GENERAL', 'LEADER', 'COMMANDER_IN_CHIEF'] },
  { code: 'PARTICIPANT', label: 'Tham gia', aliases: ['FIGHTER', 'SOLDIER'] },
  { code: 'OPPONENT', label: 'Đối đầu / Bên đối kháng', aliases: ['ENEMY', 'RIVAL'] },
  { code: 'MEDIATOR', label: 'Trung gian / Hòa giải', aliases: ['INTERMEDIARY'] },
  { code: 'WITNESS', label: 'Nhân chứng', aliases: ['OBSERVER'] },
  { code: 'ALLY', label: 'Đồng minh', aliases: ['COALITION'] },
  { code: 'DIPLOMAT', label: 'Đại diện ngoại giao / Sứ thần', aliases: ['ENVOY', 'AMBASSADOR'] },
  { code: 'VICTIM', label: 'Nạn nhân', aliases: [] },
  { code: 'CASUALTY', label: 'Tử trận / Hy sinh', aliases: ['FALLEN'] },
  { code: 'INSPIRER', label: 'Cổ vũ / Truyền cảm hứng', aliases: ['IDEOLOGUE'] },
  { code: 'COURIER', label: 'Liên lạc / Giao liên', aliases: ['MESSENGER'] },
  { code: 'MILITARY_ADVISER', label: 'Quân sư / Cố vấn quân sự', aliases: ['STRATEGIST', 'ADVISER'] },
  { code: 'OTHER_ROLE', label: 'Vai trò khác', aliases: [] },
];

export const SOURCE_FORMATS = [
  { code: 'BOOK', label: 'Sách xuất bản' },
  { code: 'JOURNAL_ARTICLE', label: 'Bài báo khoa học / Tạp chí chuyên ngành' },
  { code: 'RESEARCH_PAPER', label: 'Công trình / Kỷ yếu hội thảo' },
  { code: 'DECREE', label: 'Chiếu chỉ, sắc lệnh, văn kiện chính thức' },
  { code: 'MEMOIR', label: 'Hồi ký, tự truyện' },
  { code: 'MAP', label: 'Bản đồ lịch sử' },
  { code: 'EPIGRAPHY', label: 'Văn bia, chuông đồng, chạm khắc' },
  { code: 'CHRONICLE', label: 'Biên niên sử, quốc sử cổ' },
  { code: 'ARCHIVAL_DOCUMENT', label: 'Hồ sơ lưu trữ quốc gia' },
  { code: 'OTHER_FORMAT', label: 'Hình thức khác' },
];

export const SOURCE_NATURES = [
  { code: 'PRIMARY_SOURCE', label: 'Sử liệu gốc / Sơ cấp' },
  { code: 'SECONDARY_SOURCE', label: 'Tư liệu thứ cấp / Nghiên cứu khảo cứu' },
  { code: 'TERTIARY_SOURCE', label: 'Tư liệu tam cấp / Bách khoa, tổng hợp' },
  { code: 'ORAL_HISTORY', label: 'Lời kể nhân chứng / Lịch sử truyền khẩu' },
  { code: 'CONTEMPORARY_RECORD', label: 'Ghi chép đương thời' },
  { code: 'ARCHAEOLOGICAL_EVIDENCE', label: 'Hiện vật / Di chỉ khảo cổ học' },
];

export async function seedTaxonomyV1() {
  console.log('🚀 Bắt đầu Seeding Taxonomy Specification v1.0...');

  // 1. Seed 7 Taxonomy Groups
  for (const group of TAXONOMY_GROUPS_V1) {
    await prisma.taxonomyGroup.upsert({
      where: { code: group.code },
      create: {
        code: group.code,
        label: group.label,
        description: group.description,
        hierarchical: group.hierarchical,
        displayOrder: group.displayOrder,
      },
      update: {
        label: group.label,
        description: group.description,
        hierarchical: group.hierarchical,
        displayOrder: group.displayOrder,
      },
    });
  }
  console.log(`✅ Đã nạp thành công ${TAXONOMY_GROUPS_V1.length} Taxonomy Groups v1.`);

  // 2. Seed EVENT_TYPE (Parent Categories + Child Terms)
  const eventGroup = 'EVENT_TYPE';
  const categoryMap = new Map<string, string>();
  for (let i = 0; i < EVENT_TYPE_CATEGORIES.length; i++) {
    const cat = EVENT_TYPE_CATEGORIES[i];
    const term = await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: eventGroup, code: cat.code } },
      create: {
        groupCode: eventGroup,
        code: cat.code,
        label: cat.label,
        displayOrder: (i + 1) * 10,
      },
      update: {
        label: cat.label,
        displayOrder: (i + 1) * 10,
      },
    });
    categoryMap.set(cat.code, term.id);
  }

  for (let i = 0; i < EVENT_TYPES.length; i++) {
    const et = EVENT_TYPES[i];
    const parentId = categoryMap.get(et.parentCode);
    await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: eventGroup, code: et.code } },
      create: {
        groupCode: eventGroup,
        code: et.code,
        label: et.label,
        parentId: parentId || null,
        displayOrder: i + 1,
      },
      update: {
        label: et.label,
        parentId: parentId || null,
        displayOrder: i + 1,
      },
    });
  }
  console.log(`✅ Đã nạp ${EVENT_TYPES.length} Event Types theo phân cấp.`);

  // 3. Seed PERIOD_TYPE
  for (let i = 0; i < PERIOD_TYPES.length; i++) {
    const pt = PERIOD_TYPES[i];
    await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: 'PERIOD_TYPE', code: pt.code } },
      create: {
        groupCode: 'PERIOD_TYPE',
        code: pt.code,
        label: pt.label,
        displayOrder: i + 1,
      },
      update: {
        label: pt.label,
        displayOrder: i + 1,
      },
    });
  }
  console.log(`✅ Đã nạp ${PERIOD_TYPES.length} Period Types.`);

  // 4. Seed SITE_TYPE
  for (let i = 0; i < SITE_TYPES.length; i++) {
    const st = SITE_TYPES[i];
    await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: 'SITE_TYPE', code: st.code } },
      create: {
        groupCode: 'SITE_TYPE',
        code: st.code,
        label: st.label,
        displayOrder: i + 1,
      },
      update: {
        label: st.label,
        displayOrder: i + 1,
      },
    });
  }
  console.log(`✅ Đã nạp ${SITE_TYPES.length} Site Types.`);

  // 5. Seed PREDICATE & TaxonomyPredicateRule
  for (let i = 0; i < PREDICATE_SPECS.length; i++) {
    const spec = PREDICATE_SPECS[i];
    const term = await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: 'PREDICATE', code: spec.code } },
      create: {
        groupCode: 'PREDICATE',
        code: spec.code,
        label: spec.label,
        inverseLabel: spec.inverseLabel,
        description: spec.description,
        displayOrder: i + 1,
      },
      update: {
        label: spec.label,
        inverseLabel: spec.inverseLabel,
        description: spec.description,
        displayOrder: i + 1,
      },
    });

    await prisma.taxonomyPredicateRule.upsert({
      where: { predicateTermId: term.id },
      create: {
        predicateTermId: term.id,
        allowedSubjectTypes: spec.rule.allowedSubjectTypes,
        allowedObjectTypes: spec.rule.allowedObjectTypes,
        isSymmetric: spec.rule.isSymmetric,
        isTransitive: spec.rule.isTransitive,
        allowedQualifiers: spec.rule.allowedQualifiers,
        isRequiredQualifiers: spec.rule.isRequiredQualifiers,
      },
      update: {
        allowedSubjectTypes: spec.rule.allowedSubjectTypes,
        allowedObjectTypes: spec.rule.allowedObjectTypes,
        isSymmetric: spec.rule.isSymmetric,
        isTransitive: spec.rule.isTransitive,
        allowedQualifiers: spec.rule.allowedQualifiers,
        isRequiredQualifiers: spec.rule.isRequiredQualifiers,
      },
    });
  }
  console.log(`✅ Đã nạp ${PREDICATE_SPECS.length} Predicates và TaxonomyPredicateRules.`);

  // 6. Seed ROLE_TYPE (Event Participant Roles)
  for (let i = 0; i < ROLE_TYPES.length; i++) {
    const rt = ROLE_TYPES[i];
    await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: 'ROLE_TYPE', code: rt.code } },
      create: {
        groupCode: 'ROLE_TYPE',
        code: rt.code,
        label: rt.label,
        aliases: rt.aliases,
        displayOrder: i + 1,
      },
      update: {
        label: rt.label,
        aliases: rt.aliases,
        displayOrder: i + 1,
      },
    });
  }
  console.log(`✅ Đã nạp ${ROLE_TYPES.length} Event Participant Role Types.`);

  // 7. Seed SOURCE_FORMAT & SOURCE_NATURE
  for (let i = 0; i < SOURCE_FORMATS.length; i++) {
    const sf = SOURCE_FORMATS[i];
    await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: 'SOURCE_FORMAT', code: sf.code } },
      create: {
        groupCode: 'SOURCE_FORMAT',
        code: sf.code,
        label: sf.label,
        displayOrder: i + 1,
      },
      update: {
        label: sf.label,
        displayOrder: i + 1,
      },
    });
  }
  console.log(`✅ Đã nạp ${SOURCE_FORMATS.length} Source Formats.`);

  for (let i = 0; i < SOURCE_NATURES.length; i++) {
    const sn = SOURCE_NATURES[i];
    await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: 'SOURCE_NATURE', code: sn.code } },
      create: {
        groupCode: 'SOURCE_NATURE',
        code: sn.code,
        label: sn.label,
        displayOrder: i + 1,
      },
      update: {
        label: sn.label,
        displayOrder: i + 1,
      },
    });
  }
  console.log(`✅ Đã nạp ${SOURCE_NATURES.length} Source Natures.`);

  // 8. Seed REGION (có phân cấp — Pháp là con của Châu Âu & Địa Trung Hải)
  // Trước đây nhóm này chỉ được tạo bằng migration SQL tay (20261023030000), tách
  // rời quy trình seed idempotent này — gộp lại đây để chỉ còn một nguồn sự thật.
  const regionGroup = 'REGION';
  const regionIdByCode = new Map<string, string>();
  for (let i = 0; i < REGION_TYPES.length; i++) {
    const rg = REGION_TYPES[i];
    if (rg.parentCode) continue; // tạo các term gốc (không cha) trước
    const term = await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: regionGroup, code: rg.code } },
      create: {
        groupCode: regionGroup,
        code: rg.code,
        label: rg.label,
        aliases: rg.aliases,
        displayOrder: i + 1,
      },
      update: {
        label: rg.label,
        aliases: rg.aliases,
        displayOrder: i + 1,
      },
    });
    regionIdByCode.set(rg.code, term.id);
  }
  for (let i = 0; i < REGION_TYPES.length; i++) {
    const rg = REGION_TYPES[i];
    if (!rg.parentCode) continue; // tạo các term con sau khi đã có id của cha
    const parentId = regionIdByCode.get(rg.parentCode) || null;
    await prisma.taxonomyTerm.upsert({
      where: { groupCode_code: { groupCode: regionGroup, code: rg.code } },
      create: {
        groupCode: regionGroup,
        code: rg.code,
        label: rg.label,
        aliases: rg.aliases,
        parentId,
        displayOrder: i + 1,
      },
      update: {
        label: rg.label,
        aliases: rg.aliases,
        parentId,
        displayOrder: i + 1,
      },
    });
  }
  console.log(`✅ Đã nạp ${REGION_TYPES.length} Region/Khu vực (có phân cấp).`);

  console.log('🎉 Hoàn thành xuất sắc Seeding Taxonomy Specification v1.0!');
}

if (require.main === module) {
  seedTaxonomyV1()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
