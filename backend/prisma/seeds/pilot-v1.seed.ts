/**
 * Pilot Seed v1.0 — theo Data Scope v1.0 (chốt 02/11/2026).
 *
 * 3 cụm lịch sử có liên kết, dùng chung kiến trúc Knowledge Graph (Entity/Event/Period/
 * Statement/Reference/Taxonomy) — KHÔNG dùng bảng nối cũ `HistoricalEventEntity`/
 * `HistoricalEntityRelation`/`HistoricalEventRelation`. Quy ước áp dụng xuyên suốt:
 *   - Quan hệ "nhân vật/tổ chức tham gia 1 sự kiện cụ thể" → luôn đi qua
 *     `HistoricalEventParticipant` (bảng chuẩn hoá, có roleTermId).
 *   - Mọi quan hệ khác (Entity-Entity, Event-Event, Event-Location, Entity "trị vì"...)
 *     → đi qua `HistoricalStatement` (Subject-Predicate-Object + Qualifier + Reference).
 *   - Quan hệ Event-Period → luôn đi qua bảng nối `HistoricalEventPeriod`, KHÔNG tạo
 *     Statement trỏ tới Period (Period không phải Entity/Event nên Statement không hỗ
 *     trợ Period làm Subject/Object).
 *   - KHÔNG tạo dữ liệu/quan hệ không có căn cứ chỉ để đạt chỉ tiêu số lượng (Data Scope
 *     mục 5 & mục 6 — số lượng mục tiêu là chỉ tiêu định hướng, không phải quota).
 *
 * Idempotent: chạy lại nhiều lần an toàn (upsert theo slug/code), không xoá dữ liệu khác.
 * Yêu cầu: đã chạy `seedTaxonomyV1()` trước (predicate/role/site-type/region/source đã có).
 */
import 'dotenv/config';
import {
  PrismaClient,
  HistoricalEntityType,
  ContentStatus,
  VerificationStatus,
  DatePrecision,
  StatementValueType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

// ----------------------------------------------------------------------------
// Helpers chung
// ----------------------------------------------------------------------------

const termCache = new Map<string, string>();

/** Tra id của 1 TaxonomyTerm theo groupCode+code, báo lỗi rõ ràng nếu thiếu (seed taxonomy trước). */
async function termId(groupCode: string, code: string): Promise<string> {
  const key = `${groupCode}.${code}`;
  if (termCache.has(key)) return termCache.get(key)!;
  const term = await prisma.taxonomyTerm.findUnique({
    where: { groupCode_code: { groupCode, code } },
  });
  if (!term) {
    throw new Error(
      `[pilot-v1.seed] Thiếu TaxonomyTerm ${groupCode}.${code} — chạy seedTaxonomyV1() trước khi seed Pilot.`,
    );
  }
  termCache.set(key, term.id);
  return term.id;
}

interface EntityInput {
  slug: string;
  name: string;
  type: HistoricalEntityType;
  tagline?: string;
  description?: string;
  aliases?: string[];
  startYear?: number;
  endYear?: number;
  datePrecision?: DatePrecision;
  dateText?: string;
  isFeatured?: boolean;
}

async function upsertEntity(input: EntityInput) {
  const data = {
    name: input.name,
    type: input.type,
    tagline: input.tagline ?? null,
    description: input.description ?? null,
    aliases: input.aliases ?? [],
    startYear: input.startYear ?? null,
    endYear: input.endYear ?? null,
    datePrecision: input.datePrecision ?? null,
    dateText: input.dateText ?? null,
    isFeatured: input.isFeatured ?? false,
    status: ContentStatus.PUBLISHED,
  };
  return prisma.historicalEntity.upsert({
    where: { slug: input.slug },
    create: { slug: input.slug, ...data },
    update: data,
  });
}

async function upsertPerson(
  entityId: string,
  data: {
    biography?: string;
    birthYear?: number;
    deathYear?: number;
    birthDateText?: string;
    deathDateText?: string;
    birthPrecision?: DatePrecision;
    deathPrecision?: DatePrecision;
  },
) {
  const payload = {
    biography: data.biography ?? null,
    birthYear: data.birthYear ?? null,
    deathYear: data.deathYear ?? null,
    birthDateText: data.birthDateText ?? null,
    deathDateText: data.deathDateText ?? null,
    birthPrecision: data.birthPrecision ?? (data.birthYear ? DatePrecision.YEAR : null),
    deathPrecision: data.deathPrecision ?? (data.deathYear ? DatePrecision.YEAR : null),
  };
  return prisma.person.upsert({
    where: { entityId },
    create: { entityId, ...payload },
    update: payload,
  });
}

async function upsertSite(
  entityId: string,
  data: {
    siteTypeCode: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  const siteTypeId = await termId('SITE_TYPE', data.siteTypeCode);
  const payload = {
    siteType: data.siteTypeCode,
    siteTypeId,
    address: data.address ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
  };
  return prisma.historicalSite.upsert({
    where: { entityId },
    create: { entityId, ...payload },
    update: payload,
  });
}

interface PeriodInput {
  slug: string;
  name: string;
  startYear?: number;
  endYear?: number;
  datePrecision?: DatePrecision;
  timeLabel?: string;
  regionCode: string;
  periodTypeCode: string;
  description?: string;
  parentSlug?: string;
}

async function upsertPeriod(input: PeriodInput) {
  const [regionId, periodTypeId] = await Promise.all([
    termId('REGION', input.regionCode),
    termId('PERIOD_TYPE', input.periodTypeCode),
  ]);
  let parentId: string | null = null;
  if (input.parentSlug) {
    const parent = await prisma.period.findUnique({ where: { slug: input.parentSlug } });
    parentId = parent?.id ?? null;
  }
  const data = {
    name: input.name,
    startYear: input.startYear ?? null,
    endYear: input.endYear ?? null,
    datePrecision: input.datePrecision ?? DatePrecision.YEAR,
    timeLabel: input.timeLabel ?? null,
    region: input.regionCode,
    regionId,
    periodTypeId,
    description: input.description ?? null,
    parentId,
    status: ContentStatus.PUBLISHED,
  };
  return prisma.period.upsert({
    where: { slug: input.slug },
    create: { slug: input.slug, ...data },
    update: data,
  });
}

interface EventInput {
  slug: string;
  title: string;
  startYear?: number;
  startMonth?: number;
  startDay?: number;
  endYear?: number;
  endMonth?: number;
  endDay?: number;
  datePrecision: DatePrecision;
  summary?: string;
  description?: string;
  categoryCodes: string[]; // EVENT_TYPE codes (categoryIds)
  locationSlug?: string;
  parentSlug?: string;
}

async function upsertEvent(input: EventInput) {
  const categoryIds = await Promise.all(
    input.categoryCodes.map((c) => termId('EVENT_TYPE', c)),
  );
  let locationId: string | null = null;
  if (input.locationSlug) {
    const loc = await prisma.historicalEntity.findUnique({ where: { slug: input.locationSlug } });
    locationId = loc?.id ?? null;
  }
  let parentId: string | null = null;
  if (input.parentSlug) {
    const parent = await prisma.historicalEntity.findUnique({ where: { slug: input.parentSlug } });
    parentId = parent?.id ?? null;
  }

  const entityData = {
    name: input.title,
    type: HistoricalEntityType.EVENT,
    startYear: input.startYear ?? null,
    startMonth: input.startMonth ?? null,
    startDay: input.startDay ?? null,
    endYear: input.endYear ?? null,
    endMonth: input.endMonth ?? null,
    endDay: input.endDay ?? null,
    datePrecision: input.datePrecision,
    tagline: input.summary ?? null,
    // Frontend (sk-adapter.ts toTimelineEvent) đọc `description` cho cả phần tóm tắt lẫn
    // nội dung chi tiết trên Dòng thời gian — Pilot chỉ viết `summary` 1 câu nên mặc định
    // description = summary luôn, trừ khi có content dài hơn khai báo riêng.
    description: input.description ?? input.summary ?? null,
    status: ContentStatus.PUBLISHED,
  };

  const existing = await prisma.historicalEntity.findUnique({ where: { slug: input.slug } });
  const event = existing
    ? await prisma.historicalEntity.update({
        where: { id: existing.id },
        data: {
          ...entityData,
          event: { update: { categoryIds, parentId } },
        },
      })
    : await prisma.historicalEntity.create({
        data: {
          slug: input.slug,
          ...entityData,
          event: { create: { categoryIds, parentId } },
        },
      });

  // Vị trí diễn ra sự kiện gắn qua Statement OCCURRED_AT (subject=event, object=location) —
  // không còn cột location_id trực tiếp trên bảng con HistoricalEvent.
  await linkEventLocation(event.id, locationId);
  return event;
}

/** Gắn địa điểm chính diễn ra sự kiện qua Statement OCCURRED_AT (subject=event, object=location). */
async function linkEventLocation(eventEntityId: string, locationId: string | null) {
  const occurredAtId = await termId('PREDICATE', 'OCCURRED_AT');
  const existing = await prisma.historicalStatement.findFirst({
    where: { subjectId: eventEntityId, predicateId: occurredAtId },
  });
  if (!locationId) {
    if (existing) await prisma.historicalStatement.delete({ where: { id: existing.id } });
    return;
  }
  if (existing) {
    await prisma.historicalStatement.update({ where: { id: existing.id }, data: { objectId: locationId } });
  } else {
    await prisma.historicalStatement.create({
      data: { subjectId: eventEntityId, predicateId: occurredAtId, objectId: locationId },
    });
  }
}

async function linkEventPeriod(eventSlug: string, periodSlug: string, isPrimary = true) {
  const [event, period] = await Promise.all([
    prisma.historicalEntity.findUnique({ where: { slug: eventSlug } }),
    prisma.period.findUnique({ where: { slug: periodSlug } }),
  ]);
  if (!event || !period) {
    throw new Error(`[pilot-v1.seed] Không tìm thấy event "${eventSlug}" hoặc period "${periodSlug}" để nối.`);
  }
  // Event giờ là 1 HistoricalEntity — không còn bảng nối HistoricalEventPeriod, chỉ set
  // trực tiếp cột period_id trên Entity. Chỉ set cho liên kết chính (isPrimary) để 1 sự
  // kiện thuộc nhiều Period (hiếm) vẫn chỉ có đúng 1 "periodId chính".
  if (isPrimary && !event.periodId) {
    await prisma.historicalEntity.update({
      where: { id: event.id },
      data: { periodId: period.id },
    });
  }
}

/** Gắn predicate PREDICATE.<code> cho 1 phát biểu tham gia sự kiện, fallback PARTICIPATED_IN. */
async function resolveParticipantPredicateId(roleCode: string): Promise<string> {
  const term = await prisma.taxonomyTerm.findFirst({
    where: { groupCode: 'PREDICATE', code: roleCode },
  });
  if (term) return term.id;
  return termId('PREDICATE', 'PARTICIPATED_IN');
}

async function addParticipant(input: {
  eventSlug: string;
  entitySlug: string;
  roleCode: string;
  roleLabelOverride?: string;
  isPrimary?: boolean;
  startYear?: number;
  endYear?: number;
  notes?: string;
}) {
  const [event, entity, predicateId] = await Promise.all([
    prisma.historicalEntity.findUnique({ where: { slug: input.eventSlug } }),
    prisma.historicalEntity.findUnique({ where: { slug: input.entitySlug } }),
    resolveParticipantPredicateId(input.roleCode),
  ]);
  if (!event || !entity) {
    throw new Error(
      `[pilot-v1.seed] Không tìm thấy event "${input.eventSlug}" hoặc entity "${input.entitySlug}" để gắn participant.`,
    );
  }
  const existing = await prisma.historicalStatement.findFirst({
    where: { subjectId: entity.id, objectId: event.id, predicateId },
  });
  const data = {
    isPrimary: input.isPrimary ?? false,
    validFromYear: input.startYear ?? null,
    validToYear: input.endYear ?? null,
    qualifiers: {
      role: input.roleCode,
      roleLabel: input.roleLabelOverride ?? null,
      notes: input.notes ?? null,
    },
  };
  if (existing) {
    await prisma.historicalStatement.update({ where: { id: existing.id }, data });
    return existing.id;
  }
  const created = await prisma.historicalStatement.create({
    data: { subjectId: entity.id, objectId: event.id, predicateId, ...data },
  });
  return created.id;
}

type NodeRef =
  | { kind: 'entity'; slug: string }
  | { kind: 'event'; slug: string }
  | { kind: 'literal'; value: any; valueType: StatementValueType };

/** Event giờ cũng là 1 HistoricalEntity — cả 'entity' và 'event' đều tra bằng slug Entity. */
async function resolveNode(ref: NodeRef): Promise<{ entityId?: string }> {
  if (ref.kind === 'entity' || ref.kind === 'event') {
    const e = await prisma.historicalEntity.findUnique({ where: { slug: ref.slug } });
    if (!e) throw new Error(`[pilot-v1.seed] "${ref.slug}" không tồn tại.`);
    return { entityId: e.id };
  }
  return {};
}

interface StatementInput {
  subject: NodeRef;
  predicateCode: string;
  object: NodeRef;
  qualifiers?: Record<string, any>;
  validFromYear?: number;
  validToYear?: number;
  verificationStatus?: VerificationStatus;
  isPrimary?: boolean;
  referenceSlugs?: { refCode: string; pageNumber?: string; quote?: string }[];
}

async function addStatement(input: StatementInput) {
  const [predicateId, subjectRef, objectRef] = await Promise.all([
    termId('PREDICATE', input.predicateCode),
    resolveNode(input.subject),
    input.object.kind === 'literal'
      ? Promise.resolve<{ entityId?: string }>({})
      : resolveNode(input.object),
  ]);

  const data: any = {
    subjectId: subjectRef.entityId,
    predicateId,
    qualifiers: input.qualifiers ?? undefined,
    validFromYear: input.validFromYear ?? null,
    validToYear: input.validToYear ?? null,
    verificationStatus: input.verificationStatus ?? VerificationStatus.VERIFIED,
    isPrimary: input.isPrimary ?? false,
  };

  if (input.object.kind === 'literal') {
    data.objectValue = input.object.value;
    data.objectValueType = input.object.valueType;
  } else {
    data.objectId = objectRef.entityId;
  }

  // Chống trùng: cùng subject + predicate + object thì update thay vì tạo bản ghi mới.
  const whereDup: any = { predicateId, subjectId: data.subjectId };
  if (data.objectId) whereDup.objectId = data.objectId;

  const existing =
    input.object.kind === 'literal'
      ? null
      : await prisma.historicalStatement.findFirst({ where: whereDup });

  const statement = existing
    ? await prisma.historicalStatement.update({ where: { id: existing.id }, data })
    : await prisma.historicalStatement.create({ data });

  if (input.referenceSlugs?.length) {
    for (const r of input.referenceSlugs) {
      const ref = referenceIdByCode.get(r.refCode);
      if (!ref) continue;
      await prisma.historicalStatementReference.upsert({
        where: {
          statementId_referenceId_pageNumber: {
            statementId: statement.id,
            referenceId: ref,
            pageNumber: r.pageNumber ?? '',
          },
        },
        create: {
          statementId: statement.id,
          referenceId: ref,
          pageNumber: r.pageNumber ?? null,
          quote: r.quote ?? null,
        },
        update: { quote: r.quote ?? null },
      });
    }
  }
  return statement;
}

const referenceIdByCode = new Map<string, string>();

async function upsertReference(input: {
  code: string;
  title: string;
  author?: string;
  publisher?: string;
  publishYear?: number;
  url?: string;
  formatCode: string;
  natureCode: string;
}) {
  const [formatTermId, natureTermId] = await Promise.all([
    termId('SOURCE_FORMAT', input.formatCode),
    termId('SOURCE_NATURE', input.natureCode),
  ]);
  const data = {
    title: input.title,
    author: input.author ?? null,
    publisher: input.publisher ?? null,
    publishYear: input.publishYear ?? null,
    url: input.url ?? null,
    formatTermId,
    natureTermId,
  };
  // Reference không có unique key tự nhiên trong schema — tra theo title để idempotent.
  const existing = await prisma.historicalReference.findFirst({ where: { title: input.title } });
  const ref = existing
    ? await prisma.historicalReference.update({ where: { id: existing.id }, data })
    : await prisma.historicalReference.create({ data });
  referenceIdByCode.set(input.code, ref.id);
  return ref;
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

export async function seedPilotV1() {
  console.log('🚀 Bắt đầu Seed Pilot v1.0 (Data Scope v1.0 — 02/11/2026)...');

  // ==========================================================================
  // 0. REFERENCES (nguồn tư liệu — tổng quát, không bịa số trang cụ thể)
  // ==========================================================================
  await Promise.all([
    upsertReference({
      code: 'DVSKTT',
      title: 'Đại Việt Sử Ký Toàn Thư',
      author: 'Ngô Sĩ Liên và các sử thần triều Lê (biên soạn)',
      formatCode: 'CHRONICLE',
      natureCode: 'SECONDARY_SOURCE',
    }),
    upsertReference({
      code: 'SGK_LS12',
      title: 'Sách giáo khoa Lịch sử 12',
      publisher: 'NXB Giáo dục Việt Nam',
      formatCode: 'BOOK',
      natureCode: 'TERTIARY_SOURCE',
    }),
    upsertReference({
      code: 'TUYEN_NGON_DL',
      title: 'Tuyên ngôn Độc lập nước Việt Nam Dân chủ Cộng hòa (02/09/1945)',
      author: 'Hồ Chí Minh',
      publishYear: 1945,
      formatCode: 'DECREE',
      natureCode: 'PRIMARY_SOURCE',
    }),
    upsertReference({
      code: 'HCM_TOAN_TAP',
      title: 'Hồ Chí Minh Toàn tập',
      publisher: 'NXB Chính trị Quốc gia',
      formatCode: 'BOOK',
      natureCode: 'SECONDARY_SOURCE',
    }),
    upsertReference({
      code: 'LOC_VIETNAM',
      title: 'Vietnam: A Country Study',
      publisher: 'Library of Congress — Federal Research Division',
      formatCode: 'RESEARCH_PAPER',
      natureCode: 'SECONDARY_SOURCE',
    }),
    upsertReference({
      code: 'BRITANNICA_FR',
      title: 'Encyclopaedia Britannica — French Revolution',
      publisher: 'Encyclopaedia Britannica, Inc.',
      formatCode: 'OTHER_FORMAT',
      natureCode: 'TERTIARY_SOURCE',
    }),
    upsertReference({
      code: 'LAROUSSE_FR',
      title: 'Larousse — Révolution française',
      publisher: 'Éditions Larousse',
      formatCode: 'OTHER_FORMAT',
      natureCode: 'TERTIARY_SOURCE',
    }),
    upsertReference({
      code: 'DDHC_1789',
      title: "Déclaration des droits de l'homme et du citoyen (26/08/1789)",
      publishYear: 1789,
      formatCode: 'DECREE',
      natureCode: 'PRIMARY_SOURCE',
    }),
    upsertReference({
      code: 'VIEN_SU_HOC',
      title: 'Lịch sử Việt Nam, Tập 2',
      publisher: 'Viện Sử học — NXB Khoa học Xã hội',
      formatCode: 'BOOK',
      natureCode: 'SECONDARY_SOURCE',
    }),
  ]);
  console.log(`✅ Đã nạp ${referenceIdByCode.size} Reference.`);

  // ==========================================================================
  // CỤM A — NHÀ TRẦN & KHÁNG CHIẾN CHỐNG NGUYÊN - MÔNG (1225-1400 / 1258-1288)
  // ==========================================================================
  await upsertPeriod({
    slug: 'nha-tran',
    name: 'Nhà Trần',
    startYear: 1225,
    endYear: 1400,
    regionCode: 'VIETNAM',
    periodTypeCode: 'DYNASTY_PERIOD',
    description: 'Triều đại phong kiến Đại Việt, nổi bật với 3 lần kháng chiến chống quân Nguyên - Mông xâm lược.',
  });
  await upsertPeriod({
    slug: 'khang-chien-chong-nguyen-mong',
    name: 'Ba lần kháng chiến chống Nguyên - Mông',
    startYear: 1258,
    endYear: 1288,
    regionCode: 'VIETNAM',
    periodTypeCode: 'WAR_PERIOD',
    parentSlug: 'nha-tran',
    description: 'Ba cuộc kháng chiến của Đại Việt thời Trần chống quân Nguyên - Mông xâm lược (1258, 1285, 1287-1288).',
  });

  const personsA: Array<EntityInput & { biography?: string }> = [
    { slug: 'tran-thai-tong', name: 'Trần Thái Tông', type: HistoricalEntityType.PERSON, tagline: 'Vị vua đầu tiên nhà Trần', isFeatured: true },
    { slug: 'tran-thanh-tong', name: 'Trần Thánh Tông', type: HistoricalEntityType.PERSON, tagline: 'Vị vua thứ hai nhà Trần' },
    { slug: 'tran-nhan-tong', name: 'Trần Nhân Tông', type: HistoricalEntityType.PERSON, tagline: 'Vị vua lãnh đạo 2 cuộc kháng chiến chống Nguyên - Mông', isFeatured: true },
    { slug: 'tran-hung-dao', name: 'Trần Hưng Đạo', aliases: ['Trần Quốc Tuấn', 'Hưng Đạo Vương'], type: HistoricalEntityType.PERSON, tagline: 'Tổng chỉ huy quân đội Đại Việt chống Nguyên - Mông', isFeatured: true },
    { slug: 'tran-thu-do', name: 'Trần Thủ Độ', type: HistoricalEntityType.PERSON, tagline: 'Người đặt nền móng sáng lập nhà Trần' },
    { slug: 'tran-quang-khai', name: 'Trần Quang Khải', type: HistoricalEntityType.PERSON, tagline: 'Thượng tướng Thái sư, chỉ huy trận Chương Dương' },
    { slug: 'tran-binh-trong', name: 'Trần Bình Trọng', type: HistoricalEntityType.PERSON, tagline: 'Tướng trẻ hy sinh trong kháng chiến lần thứ hai' },
    { slug: 'tran-quoc-toan', name: 'Trần Quốc Toản', type: HistoricalEntityType.PERSON, tagline: 'Thiếu niên anh hùng kháng chiến chống Nguyên - Mông' },
    { slug: 'tran-khanh-du', name: 'Trần Khánh Dư', type: HistoricalEntityType.PERSON, tagline: 'Tướng chỉ huy thủy quân Đại Việt' },
    { slug: 'thoat-hoan', name: 'Thoát Hoan', type: HistoricalEntityType.PERSON, tagline: 'Hoàng tử Nguyên, chỉ huy quân viễn chinh xâm lược Đại Việt' },
    { slug: 'o-ma-nhi', name: 'Ô Mã Nhi', type: HistoricalEntityType.PERSON, tagline: 'Tướng thủy quân Nguyên, bại trận ở Bạch Đằng' },
    { slug: 'hot-tat-liet', name: 'Hốt Tất Liệt', aliases: ['Kublai Khan'], type: HistoricalEntityType.PERSON, tagline: 'Hoàng đế nhà Nguyên, phát động 3 lần xâm lược Đại Việt' },
  ];
  for (const p of personsA) {
    const e = await upsertEntity(p);
    await upsertPerson(e.id, { biography: p.tagline });
  }

  // Hồ sơ nhân vật mẫu đầy đủ (Thân thế/Sự nghiệp/Di sản/Tác phẩm/Giai thoại) cho Trần
  // Hưng Đạo — minh hoạ trang /nhan-vat/[slug] đọc được nội dung chương hồi thật, không
  // chỉ 1 câu tagline. Tóm lược và diễn đạt lại theo lời riêng (không sao chép nguyên văn
  // Wikipedia), ngắn hơn đáng kể so với nguồn.
  {
    const thd = await prisma.historicalEntity.findUnique({ where: { slug: 'tran-hung-dao' } });
    if (thd) {
      await prisma.historicalEntity.update({
        where: { id: thd.id },
        data: {
          metadata: {
            profile: {
              hometown: 'Phủ Thiên Trường (nay thuộc Nam Định)',
              backgroundAndYouth:
                'Là con trai của Trần Liễu — anh ruột vua Trần Thái Tông — Trần Quốc Tuấn lớn lên giữa mâu thuẫn nội tộc sau sự kiện năm 1237, khi cha ông bị ép nhường vợ cho em trai theo lệnh Thái sư Trần Thủ Độ. Từ nhỏ ông được người cô là Thụy Bà công chúa nuôi dưỡng.',
              legacyAndHonors:
                'Sau khi mất năm 1300, ông được dân gian tôn xưng "Đức Thánh Trần" và thờ phụng ở nhiều nơi, tiêu biểu là đền Kiếp Bạc (Hải Dương). Ông được xem là một trong những nhà quân sự kiệt xuất nhất lịch sử Việt Nam.',
              notableWorks: ['Hịch tướng sĩ', 'Binh thư yếu lược', 'Vạn Kiếp tông bí truyền thư'],
              anecdotes: [
                'Trước khi mất, Trần Liễu từng dặn con phải trả thù giúp cha. Trần Quốc Tuấn đem lời ấy dò ý hai gia thần Dã Tượng và Yết Kiêu — cả hai đều khuyên giữ trọn trung hiếu, khiến ông cảm phục mà từ bỏ ý định.',
              ],
              famousQuote: 'Khoan thư sức dân để làm kế sâu rễ bền gốc, đó là thượng sách giữ nước vậy.',
            },
          },
        },
      });
      await prisma.person.update({
        where: { entityId: thd.id },
        data: {
          biography:
            'Trần Quốc Tuấn giữ vai trò khá mờ nhạt trong cuộc kháng chiến năm 1258, nhưng tới cuộc xâm lược lần hai của quân Nguyên năm 1285, ông được giao chức Quốc công tiết chế, trực tiếp chỉ huy quân đội Đại Việt. Gạt bỏ hiềm khích gia tộc, ông dốc sức phò tá vua Trần Nhân Tông đánh đuổi quân xâm lược.\n\nTrong cuộc chiến 1287-1288, ông tiếp tục lập đại công với chiến thắng trên sông Bạch Đằng, vận dụng kế đóng cọc gỗ theo con nước — lấy cảm hứng từ chiến thắng của Ngô Quyền năm 938. Năm 1289, triều đình phong ông tước hiệu Hưng Đạo đại vương.',
        },
      });
    }
  }

  // Trần Liễu — cha của Trần Hưng Đạo, minh hoạ trường "Thân phụ" trong hộp thông tin
  // kiểu Wikipedia (/nhan-vat/[slug]) chiếu từ Statement CHILD_OF, không cần cột DB riêng.
  await upsertEntity({ slug: 'tran-lieu', name: 'Trần Liễu', type: HistoricalEntityType.PERSON, tagline: 'Thân phụ của Trần Hưng Đạo, anh ruột vua Trần Thái Tông' });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-hung-dao' }, predicateCode: 'CHILD_OF', object: { kind: 'entity', slug: 'tran-lieu' } });

  await Promise.all([
    upsertEntity({ slug: 'dai-viet', name: 'Đại Việt', type: HistoricalEntityType.ORGANIZATION, tagline: 'Quốc hiệu Việt Nam thời Trần' }),
    upsertEntity({ slug: 'nha-tran-entity', name: 'Nhà Trần (triều đại)', type: HistoricalEntityType.DYNASTY, tagline: 'Triều đại cai trị Đại Việt 1225-1400' }),
    upsertEntity({ slug: 'nha-nguyen-mong', name: 'Nhà Nguyên (Mông Cổ)', type: HistoricalEntityType.ORGANIZATION, tagline: 'Triều đại Mông Cổ cai trị Trung Hoa, 3 lần xâm lược Đại Việt' }),
    upsertEntity({ slug: 'quan-doi-nha-tran', name: 'Quân đội nhà Trần', type: HistoricalEntityType.MILITARY_FORCE, tagline: 'Lực lượng quân sự Đại Việt thời Trần' }),
    upsertEntity({ slug: 'quan-doi-nguyen', name: 'Quân đội Nguyên', type: HistoricalEntityType.MILITARY_FORCE, tagline: 'Lực lượng viễn chinh Mông - Nguyên xâm lược Đại Việt' }),
  ]);

  const sitesA: Array<{ slug: string; name: string; siteTypeCode: string; tagline: string }> = [
    { slug: 'thang-long', name: 'Thăng Long', siteTypeCode: 'CITADEL_FORTRESS', tagline: 'Kinh đô Đại Việt thời Trần' },
    { slug: 'van-kiep', name: 'Vạn Kiếp', siteTypeCode: 'HEADQUARTERS_BASE', tagline: 'Đại bản doanh của Trần Hưng Đạo' },
    { slug: 'song-bach-dang', name: 'Sông Bạch Đằng', siteTypeCode: 'BATTLEFIELD', tagline: 'Nơi diễn ra trận Bạch Đằng 1288' },
    { slug: 'thien-truong', name: 'Thiên Trường', siteTypeCode: 'PALACE', tagline: 'Cung điện của Thượng hoàng nhà Trần' },
    { slug: 'tay-ket', name: 'Tây Kết', siteTypeCode: 'BATTLEFIELD', tagline: 'Nơi diễn ra trận Tây Kết 1285' },
    { slug: 'chuong-duong', name: 'Chương Dương', siteTypeCode: 'BATTLEFIELD', tagline: 'Nơi diễn ra trận Chương Dương 1285' },
  ];
  for (const s of sitesA) {
    const e = await upsertEntity({ slug: s.slug, name: s.name, type: HistoricalEntityType.LOCATION, tagline: s.tagline });
    await upsertSite(e.id, { siteTypeCode: s.siteTypeCode });
  }

  await upsertEvent({
    slug: 'thanh-lap-nha-tran',
    title: 'Thành lập nhà Trần',
    startYear: 1225,
    datePrecision: DatePrecision.YEAR,
    summary: 'Trần Cảnh lên ngôi, mở đầu triều đại nhà Trần, thay thế nhà Lý.',
    categoryCodes: ['FOUNDATION'],
  });
  await upsertEvent({
    slug: 'khang-chien-nguyen-lan-1',
    title: 'Kháng chiến chống Nguyên - Mông lần thứ nhất',
    startYear: 1258,
    datePrecision: DatePrecision.YEAR,
    summary: 'Quân Mông Cổ lần đầu xâm lược Đại Việt, bị đánh bại, buộc rút quân.',
    categoryCodes: ['WAR'],
  });
  await upsertEvent({
    slug: 'khang-chien-nguyen-lan-2',
    title: 'Kháng chiến chống Nguyên - Mông lần thứ hai',
    startYear: 1285,
    datePrecision: DatePrecision.YEAR,
    summary: 'Quân Nguyên dưới sự chỉ huy của Thoát Hoan xâm lược Đại Việt lần thứ hai, bị đánh bại.',
    categoryCodes: ['WAR'],
  });
  await upsertEvent({
    slug: 'khang-chien-nguyen-lan-3',
    title: 'Kháng chiến chống Nguyên - Mông lần thứ ba',
    startYear: 1287,
    endYear: 1288,
    datePrecision: DatePrecision.YEAR,
    summary: 'Quân Nguyên xâm lược Đại Việt lần thứ ba, kết thúc bằng đại thắng Bạch Đằng.',
    categoryCodes: ['WAR'],
  });
  await upsertEvent({
    slug: 'tran-van-kiep',
    title: 'Trận Vạn Kiếp',
    startYear: 1285,
    datePrecision: DatePrecision.YEAR,
    summary: 'Trận đánh tại căn cứ Vạn Kiếp trong kháng chiến lần thứ hai.',
    categoryCodes: ['BATTLE'],
    locationSlug: 'van-kiep',
    parentSlug: 'khang-chien-nguyen-lan-2',
  });
  await upsertEvent({
    slug: 'tran-tay-ket',
    title: 'Trận Tây Kết',
    startYear: 1285,
    datePrecision: DatePrecision.YEAR,
    summary: 'Trận đánh tại Tây Kết trong kháng chiến lần thứ hai.',
    categoryCodes: ['BATTLE'],
    locationSlug: 'tay-ket',
    parentSlug: 'khang-chien-nguyen-lan-2',
  });
  await upsertEvent({
    slug: 'tran-bach-dang-1288',
    title: 'Trận Bạch Đằng',
    startYear: 1288,
    datePrecision: DatePrecision.YEAR,
    summary: 'Trận quyết chiến trên sông Bạch Đằng, đánh tan thủy quân Nguyên do Ô Mã Nhi chỉ huy.',
    categoryCodes: ['BATTLE'],
    locationSlug: 'song-bach-dang',
    parentSlug: 'khang-chien-nguyen-lan-3',
  });

  await linkEventPeriod('thanh-lap-nha-tran', 'nha-tran');
  for (const evt of [
    'khang-chien-nguyen-lan-1',
    'khang-chien-nguyen-lan-2',
    'khang-chien-nguyen-lan-3',
    'tran-van-kiep',
    'tran-tay-ket',
    'tran-bach-dang-1288',
  ]) {
    await linkEventPeriod(evt, 'khang-chien-chong-nguyen-mong');
  }

  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-2', entitySlug: 'tran-hung-dao', roleCode: 'COMMANDER', isPrimary: true, startYear: 1285 });
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-3', entitySlug: 'tran-hung-dao', roleCode: 'COMMANDER', isPrimary: true, startYear: 1287, endYear: 1288 });
  await addParticipant({ eventSlug: 'tran-bach-dang-1288', entitySlug: 'tran-hung-dao', roleCode: 'COMMANDER', isPrimary: true });
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-2', entitySlug: 'tran-nhan-tong', roleCode: 'COMMANDER', roleLabelOverride: 'Hoàng đế trực tiếp lãnh đạo kháng chiến' });
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-3', entitySlug: 'tran-nhan-tong', roleCode: 'COMMANDER', roleLabelOverride: 'Hoàng đế trực tiếp lãnh đạo kháng chiến' });
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-2', entitySlug: 'tran-quoc-toan', roleCode: 'PARTICIPANT' });
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-2', entitySlug: 'tran-binh-trong', roleCode: 'CASUALTY', roleLabelOverride: 'Hy sinh khi bị địch bắt, không đầu hàng' });
  // Trận Chương Dương chưa có Event riêng trong Pilot (chỉ có Site "chuong-duong") —
  // quan hệ chỉ huy của Trần Quang Khải tại đây được biểu diễn qua Statement COMMANDED
  // (xem phần Statement cụm A dưới), không tạo Participant trỏ vào Event không tồn tại.
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-3', entitySlug: 'tran-khanh-du', roleCode: 'COMMANDER', roleLabelOverride: 'Chỉ huy thủy quân' });
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-2', entitySlug: 'thoat-hoan', roleCode: 'OPPONENT', roleLabelOverride: 'Tổng chỉ huy quân Nguyên' });
  await addParticipant({ eventSlug: 'khang-chien-nguyen-lan-3', entitySlug: 'thoat-hoan', roleCode: 'OPPONENT', roleLabelOverride: 'Tổng chỉ huy quân Nguyên' });
  await addParticipant({ eventSlug: 'tran-bach-dang-1288', entitySlug: 'o-ma-nhi', roleCode: 'OPPONENT', roleLabelOverride: 'Chỉ huy thủy quân Nguyên, bị bắt sau trận' });

  await addStatement({ subject: { kind: 'entity', slug: 'tran-hung-dao' }, predicateCode: 'COMMANDED', object: { kind: 'entity', slug: 'quan-doi-nha-tran' }, qualifiers: { role: 'Tổng chỉ huy' }, validFromYear: 1285, validToYear: 1288, isPrimary: true, referenceSlugs: [{ refCode: 'DVSKTT' }] });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-quang-khai' }, predicateCode: 'COMMANDED', object: { kind: 'entity', slug: 'quan-doi-nha-tran' }, qualifiers: { role: 'Chỉ huy trận Chương Dương', site: 'Chương Dương' }, validFromYear: 1285 });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-khanh-du' }, predicateCode: 'COMMANDED', object: { kind: 'entity', slug: 'quan-doi-nha-tran' }, qualifiers: { role: 'Chỉ huy thủy quân' }, validFromYear: 1287, validToYear: 1288 });
  await addStatement({ subject: { kind: 'entity', slug: 'thoat-hoan' }, predicateCode: 'COMMANDED', object: { kind: 'entity', slug: 'quan-doi-nguyen' }, validFromYear: 1285, validToYear: 1288 });
  await addStatement({ subject: { kind: 'entity', slug: 'o-ma-nhi' }, predicateCode: 'COMMANDED', object: { kind: 'entity', slug: 'quan-doi-nguyen' }, qualifiers: { role: 'Chỉ huy thủy quân' } });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-nhan-tong' }, predicateCode: 'RULED', object: { kind: 'entity', slug: 'dai-viet' }, validFromYear: 1278, validToYear: 1293, referenceSlugs: [{ refCode: 'DVSKTT' }] });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-thai-tong' }, predicateCode: 'RULED', object: { kind: 'entity', slug: 'dai-viet' }, validFromYear: 1225, validToYear: 1258 });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-thanh-tong' }, predicateCode: 'RULED', object: { kind: 'entity', slug: 'dai-viet' }, validFromYear: 1258, validToYear: 1278 });
  await addStatement({ subject: { kind: 'entity', slug: 'hot-tat-liet' }, predicateCode: 'RULED', object: { kind: 'entity', slug: 'nha-nguyen-mong' } });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-thu-do' }, predicateCode: 'FOUNDED', object: { kind: 'entity', slug: 'nha-tran-entity' }, validFromYear: 1225 });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-thanh-tong' }, predicateCode: 'CHILD_OF', object: { kind: 'entity', slug: 'tran-thai-tong' } });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-nhan-tong' }, predicateCode: 'CHILD_OF', object: { kind: 'entity', slug: 'tran-thanh-tong' } });
  await addStatement({ subject: { kind: 'entity', slug: 'nha-tran-entity' }, predicateCode: 'OPPONENT_OF', object: { kind: 'entity', slug: 'nha-nguyen-mong' } });
  await addStatement({ subject: { kind: 'event', slug: 'tran-bach-dang-1288' }, predicateCode: 'OCCURRED_AT', object: { kind: 'entity', slug: 'song-bach-dang' }, referenceSlugs: [{ refCode: 'DVSKTT' }] });
  await addStatement({ subject: { kind: 'event', slug: 'tran-van-kiep' }, predicateCode: 'SUB_EVENT_OF', object: { kind: 'event', slug: 'khang-chien-nguyen-lan-2' } });
  await addStatement({ subject: { kind: 'event', slug: 'tran-tay-ket' }, predicateCode: 'SUB_EVENT_OF', object: { kind: 'event', slug: 'khang-chien-nguyen-lan-2' } });
  await addStatement({ subject: { kind: 'event', slug: 'tran-bach-dang-1288' }, predicateCode: 'SUB_EVENT_OF', object: { kind: 'event', slug: 'khang-chien-nguyen-lan-3' } });
  await addStatement({ subject: { kind: 'event', slug: 'khang-chien-nguyen-lan-2' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'khang-chien-nguyen-lan-1' } });
  await addStatement({ subject: { kind: 'event', slug: 'khang-chien-nguyen-lan-3' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'khang-chien-nguyen-lan-2' } });
  await addStatement({ subject: { kind: 'entity', slug: 'tran-quoc-toan' }, predicateCode: 'PARTICIPATED_IN', object: { kind: 'event', slug: 'khang-chien-nguyen-lan-2' }, qualifiers: { role: 'Thiếu niên tham gia kháng chiến' } });

  console.log('✅ Cụm A (Nhà Trần & kháng chiến chống Nguyên - Mông) hoàn tất.');

  // ==========================================================================
  // CỤM B — CÁCH MẠNG THÁNG TÁM & VIỆT NAM DÂN CHỦ CỘNG HÒA (1941-1946)
  // ==========================================================================
  await upsertPeriod({
    slug: 'cach-mang-thang-tam-1945',
    name: 'Cách mạng tháng Tám và buổi đầu Việt Nam Dân chủ Cộng hòa',
    startYear: 1941,
    endYear: 1946,
    regionCode: 'VIETNAM',
    periodTypeCode: 'TRANSITION_PERIOD',
    description: 'Giai đoạn chuyển tiếp từ ách thống trị thực dân - phát xít sang nền độc lập, đỉnh cao là Cách mạng tháng Tám 1945 và Tuyên ngôn Độc lập.',
  });

  const personsB: EntityInput[] = [
    { slug: 'ho-chi-minh', name: 'Hồ Chí Minh', type: HistoricalEntityType.PERSON, tagline: 'Lãnh tụ Việt Minh, Chủ tịch nước Việt Nam Dân chủ Cộng hòa', isFeatured: true },
    { slug: 'vo-nguyen-giap', name: 'Võ Nguyên Giáp', type: HistoricalEntityType.PERSON, tagline: 'Chỉ huy lực lượng vũ trang trong Cách mạng tháng Tám', isFeatured: true },
    { slug: 'truong-chinh', name: 'Trường Chinh', type: HistoricalEntityType.PERSON, tagline: 'Tổng Bí thư Đảng Cộng sản Đông Dương' },
    { slug: 'pham-van-dong', name: 'Phạm Văn Đồng', type: HistoricalEntityType.PERSON, tagline: 'Thành viên Chính phủ lâm thời' },
    { slug: 'bao-dai', name: 'Bảo Đại', type: HistoricalEntityType.PERSON, tagline: 'Vị vua cuối cùng triều Nguyễn, thoái vị năm 1945' },
    { slug: 'tran-trong-kim', name: 'Trần Trọng Kim', type: HistoricalEntityType.PERSON, tagline: 'Thủ tướng chính phủ do Nhật bảo trợ (1945)' },
    { slug: 'jean-decoux', name: 'Jean Decoux', type: HistoricalEntityType.PERSON, tagline: 'Toàn quyền Đông Dương bị Nhật lật đổ tháng 3/1945' },
    { slug: 'ton-duc-thang', name: 'Tôn Đức Thắng', type: HistoricalEntityType.PERSON, tagline: 'Nhà lãnh đạo cách mạng tại Nam Bộ' },
  ];
  for (const p of personsB) {
    const e = await upsertEntity(p);
    await upsertPerson(e.id, { biography: p.tagline });
  }

  await Promise.all([
    upsertEntity({ slug: 'viet-nam-dcch', name: 'Việt Nam Dân chủ Cộng hòa', type: HistoricalEntityType.ORGANIZATION, tagline: 'Nhà nước độc lập được tuyên bố ngày 02/09/1945' }),
    upsertEntity({ slug: 'viet-minh', name: 'Việt Minh', type: HistoricalEntityType.ORGANIZATION, tagline: 'Mặt trận Việt Nam Độc lập Đồng minh, thành lập năm 1941' }),
    upsertEntity({ slug: 'dang-cong-san-dong-duong', name: 'Đảng Cộng sản Đông Dương', type: HistoricalEntityType.ORGANIZATION, tagline: 'Chính đảng lãnh đạo cách mạng Việt Nam' }),
    upsertEntity({ slug: 'chinh-phu-lam-thoi-1945', name: 'Chính phủ lâm thời', type: HistoricalEntityType.ORGANIZATION, tagline: 'Chính phủ lâm thời Việt Nam Dân chủ Cộng hòa (28/08/1945)' }),
    upsertEntity({ slug: 'de-quoc-nhat-ban', name: 'Đế quốc Nhật Bản', type: HistoricalEntityType.ORGANIZATION, tagline: 'Thế lực quân phiệt chiếm đóng Đông Dương 1940-1945' }),
    upsertEntity({ slug: 'chinh-quyen-phap-dong-duong', name: 'Chính quyền Pháp tại Đông Dương', type: HistoricalEntityType.ORGANIZATION, tagline: 'Bộ máy thực dân Pháp tại Đông Dương, bị Nhật lật đổ 9/3/1945' }),
  ]);

  const sitesB: Array<{ slug: string; name: string; siteTypeCode: string; tagline: string }> = [
    { slug: 'ha-noi', name: 'Hà Nội', siteTypeCode: 'OTHER_SITE', tagline: 'Thủ đô, trung tâm Cách mạng tháng Tám ở miền Bắc' },
    { slug: 'quang-truong-ba-dinh', name: 'Quảng trường Ba Đình', siteTypeCode: 'COMMEMORATIVE_MONUMENT', tagline: 'Nơi Hồ Chí Minh đọc Tuyên ngôn Độc lập 02/09/1945' },
    { slug: 'hue-1945', name: 'Huế', siteTypeCode: 'OTHER_SITE', tagline: 'Cố đô, nơi Bảo Đại thoái vị' },
    { slug: 'sai-gon-1945', name: 'Sài Gòn', siteTypeCode: 'OTHER_SITE', tagline: 'Trung tâm Cách mạng tháng Tám ở Nam Bộ' },
    { slug: 'tan-trao', name: 'Tân Trào', siteTypeCode: 'HEADQUARTERS_BASE', tagline: 'Thủ đô Khu giải phóng, nơi họp Quốc dân Đại hội 1945' },
  ];
  for (const s of sitesB) {
    const e = await upsertEntity({ slug: s.slug, name: s.name, type: HistoricalEntityType.LOCATION, tagline: s.tagline });
    await upsertSite(e.id, { siteTypeCode: s.siteTypeCode });
  }

  await upsertEvent({ slug: 'thanh-lap-viet-minh', title: 'Thành lập Việt Minh', startYear: 1941, datePrecision: DatePrecision.YEAR, summary: 'Mặt trận Việt Nam Độc lập Đồng minh được thành lập.', categoryCodes: ['FOUNDATION'] });
  await upsertEvent({ slug: 'nan-doi-1945', title: 'Nạn đói Ất Dậu 1944-1945', startYear: 1944, endYear: 1945, datePrecision: DatePrecision.YEAR, summary: 'Nạn đói lớn ở miền Bắc Việt Nam do chính sách của Nhật - Pháp.', categoryCodes: [] });
  await upsertEvent({ slug: 'nhat-dao-chinh-phap', title: 'Nhật đảo chính Pháp', startYear: 1945, startMonth: 3, startDay: 9, datePrecision: DatePrecision.DAY, summary: 'Quân Nhật lật đổ chính quyền thực dân Pháp tại Đông Dương.', categoryCodes: ['COUP'] });
  await upsertEvent({ slug: 'nhat-dau-hang-1945', title: 'Nhật đầu hàng Đồng minh', startYear: 1945, startMonth: 8, startDay: 15, datePrecision: DatePrecision.DAY, summary: 'Nhật Bản tuyên bố đầu hàng, tạo thời cơ cho Cách mạng tháng Tám.', categoryCodes: [] });
  await upsertEvent({ slug: 'khoi-nghia-ha-noi', title: 'Khởi nghĩa giành chính quyền tại Hà Nội', startYear: 1945, startMonth: 8, startDay: 19, datePrecision: DatePrecision.DAY, summary: 'Quần chúng cách mạng giành chính quyền tại Hà Nội.', categoryCodes: ['UPRISING'], locationSlug: 'ha-noi' });
  await upsertEvent({ slug: 'khoi-nghia-hue', title: 'Khởi nghĩa giành chính quyền tại Huế', startYear: 1945, startMonth: 8, startDay: 23, datePrecision: DatePrecision.DAY, summary: 'Quần chúng cách mạng giành chính quyền tại Huế.', categoryCodes: ['UPRISING'], locationSlug: 'hue-1945' });
  await upsertEvent({ slug: 'khoi-nghia-sai-gon', title: 'Khởi nghĩa giành chính quyền tại Sài Gòn', startYear: 1945, startMonth: 8, startDay: 25, datePrecision: DatePrecision.DAY, summary: 'Quần chúng cách mạng giành chính quyền tại Sài Gòn.', categoryCodes: ['UPRISING'], locationSlug: 'sai-gon-1945' });
  await upsertEvent({ slug: 'bao-dai-thoai-vi', title: 'Bảo Đại thoái vị', startYear: 1945, startMonth: 8, startDay: 25, datePrecision: DatePrecision.DAY, summary: 'Vua Bảo Đại tuyên bố thoái vị, chấm dứt chế độ quân chủ.', categoryCodes: ['POLITICAL_TRANSITION'], locationSlug: 'hue-1945' });
  await upsertEvent({ slug: 'thanh-lap-chinh-phu-lam-thoi', title: 'Thành lập Chính phủ lâm thời', startYear: 1945, startMonth: 8, startDay: 28, datePrecision: DatePrecision.DAY, summary: 'Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa được thành lập.', categoryCodes: ['FOUNDATION'] });
  await upsertEvent({ slug: 'tuyen-ngon-doc-lap-1945', title: 'Tuyên ngôn Độc lập nước Việt Nam Dân chủ Cộng hòa', startYear: 1945, startMonth: 9, startDay: 2, datePrecision: DatePrecision.DAY, summary: 'Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình.', categoryCodes: ['DECLARATION'], locationSlug: 'quang-truong-ba-dinh' });

  for (const evt of [
    'thanh-lap-viet-minh',
    'nan-doi-1945',
    'nhat-dao-chinh-phap',
    'nhat-dau-hang-1945',
    'khoi-nghia-ha-noi',
    'khoi-nghia-hue',
    'khoi-nghia-sai-gon',
    'bao-dai-thoai-vi',
    'thanh-lap-chinh-phu-lam-thoi',
    'tuyen-ngon-doc-lap-1945',
  ]) {
    await linkEventPeriod(evt, 'cach-mang-thang-tam-1945');
  }

  await addParticipant({ eventSlug: 'thanh-lap-viet-minh', entitySlug: 'ho-chi-minh', roleCode: 'COMMANDER', isPrimary: true, roleLabelOverride: 'Người khởi xướng và lãnh đạo Việt Minh' });
  await addParticipant({ eventSlug: 'thanh-lap-chinh-phu-lam-thoi', entitySlug: 'ho-chi-minh', roleCode: 'COMMANDER', isPrimary: true, roleLabelOverride: 'Chủ tịch Chính phủ lâm thời' });
  await addParticipant({ eventSlug: 'tuyen-ngon-doc-lap-1945', entitySlug: 'ho-chi-minh', roleCode: 'COMMANDER', isPrimary: true, roleLabelOverride: 'Soạn và công bố Tuyên ngôn Độc lập' });
  await addParticipant({ eventSlug: 'khoi-nghia-ha-noi', entitySlug: 'vo-nguyen-giap', roleCode: 'COMMANDER', roleLabelOverride: 'Chỉ huy lực lượng vũ trang cách mạng' });
  await addParticipant({ eventSlug: 'thanh-lap-chinh-phu-lam-thoi', entitySlug: 'truong-chinh', roleCode: 'PARTICIPANT', roleLabelOverride: 'Tổng Bí thư Đảng Cộng sản Đông Dương' });
  await addParticipant({ eventSlug: 'thanh-lap-chinh-phu-lam-thoi', entitySlug: 'pham-van-dong', roleCode: 'PARTICIPANT' });
  await addParticipant({ eventSlug: 'bao-dai-thoai-vi', entitySlug: 'bao-dai', roleCode: 'OTHER_ROLE', isPrimary: true, roleLabelOverride: 'Vị vua thoái vị' });
  await addParticipant({ eventSlug: 'nhat-dao-chinh-phap', entitySlug: 'tran-trong-kim', roleCode: 'OTHER_ROLE', roleLabelOverride: 'Thành lập nội các dưới bảo trợ của Nhật' });
  await addParticipant({ eventSlug: 'nhat-dao-chinh-phap', entitySlug: 'jean-decoux', roleCode: 'OPPONENT', roleLabelOverride: 'Toàn quyền Đông Dương bị Nhật bắt giữ' });
  await addParticipant({ eventSlug: 'khoi-nghia-sai-gon', entitySlug: 'ton-duc-thang', roleCode: 'COMMANDER', roleLabelOverride: 'Lãnh đạo phong trào cách mạng Nam Bộ' });

  await addStatement({ subject: { kind: 'entity', slug: 'ho-chi-minh' }, predicateCode: 'MEMBER_OF', object: { kind: 'entity', slug: 'viet-minh' }, qualifiers: { role: 'Lãnh đạo tối cao', joinYear: 1941 }, isPrimary: true, referenceSlugs: [{ refCode: 'HCM_TOAN_TAP' }] });
  await addStatement({ subject: { kind: 'entity', slug: 'truong-chinh' }, predicateCode: 'MEMBER_OF', object: { kind: 'entity', slug: 'dang-cong-san-dong-duong' }, qualifiers: { role: 'Tổng Bí thư' } });
  await addStatement({ subject: { kind: 'entity', slug: 'dang-cong-san-dong-duong' }, predicateCode: 'FOUNDED', object: { kind: 'entity', slug: 'viet-minh' }, validFromYear: 1941 });
  await addStatement({ subject: { kind: 'entity', slug: 'chinh-phu-lam-thoi-1945' }, predicateCode: 'FOUNDED', object: { kind: 'entity', slug: 'viet-nam-dcch' }, validFromYear: 1945, referenceSlugs: [{ refCode: 'TUYEN_NGON_DL' }] });
  await addStatement({ subject: { kind: 'entity', slug: 'ho-chi-minh' }, predicateCode: 'RULED', object: { kind: 'entity', slug: 'viet-nam-dcch' }, validFromYear: 1945, isPrimary: true, referenceSlugs: [{ refCode: 'TUYEN_NGON_DL' }] });
  await addStatement({ subject: { kind: 'entity', slug: 'viet-minh' }, predicateCode: 'PARTICIPATED_IN', object: { kind: 'event', slug: 'khoi-nghia-ha-noi' }, qualifiers: { role: 'Tổ chức và lãnh đạo' } });
  await addStatement({ subject: { kind: 'entity', slug: 'viet-minh' }, predicateCode: 'PARTICIPATED_IN', object: { kind: 'event', slug: 'khoi-nghia-hue' }, qualifiers: { role: 'Tổ chức và lãnh đạo' } });
  await addStatement({ subject: { kind: 'entity', slug: 'viet-minh' }, predicateCode: 'PARTICIPATED_IN', object: { kind: 'event', slug: 'khoi-nghia-sai-gon' }, qualifiers: { role: 'Tổ chức và lãnh đạo' } });
  await addStatement({ subject: { kind: 'event', slug: 'bao-dai-thoai-vi' }, predicateCode: 'OCCURRED_AT', object: { kind: 'entity', slug: 'hue-1945' } });
  await addStatement({ subject: { kind: 'event', slug: 'tuyen-ngon-doc-lap-1945' }, predicateCode: 'OCCURRED_AT', object: { kind: 'entity', slug: 'quang-truong-ba-dinh' }, referenceSlugs: [{ refCode: 'TUYEN_NGON_DL' }] });
  await addStatement({ subject: { kind: 'event', slug: 'khoi-nghia-ha-noi' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'nhat-dau-hang-1945' } });
  await addStatement({ subject: { kind: 'event', slug: 'khoi-nghia-ha-noi' }, predicateCode: 'CAUSED_BY', object: { kind: 'event', slug: 'nhat-dau-hang-1945' }, qualifiers: { directness: 'Thời cơ trực tiếp từ việc Nhật đầu hàng Đồng minh' } });
  await addStatement({ subject: { kind: 'event', slug: 'thanh-lap-chinh-phu-lam-thoi' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'khoi-nghia-ha-noi' } });
  await addStatement({ subject: { kind: 'event', slug: 'tuyen-ngon-doc-lap-1945' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'thanh-lap-chinh-phu-lam-thoi' } });
  await addStatement({ subject: { kind: 'entity', slug: 'de-quoc-nhat-ban' }, predicateCode: 'OPPONENT_OF', object: { kind: 'entity', slug: 'chinh-quyen-phap-dong-duong' }, qualifiers: { context: 'Đảo chính 9/3/1945' } });
  await addStatement({ subject: { kind: 'entity', slug: 'viet-minh' }, predicateCode: 'OPPONENT_OF', object: { kind: 'entity', slug: 'chinh-quyen-phap-dong-duong' } });

  console.log('✅ Cụm B (Cách mạng tháng Tám) hoàn tất.');

  // ==========================================================================
  // CỤM C — CÁCH MẠNG PHÁP (1787-1799)
  // ==========================================================================
  await upsertPeriod({
    slug: 'cach-mang-phap',
    name: 'Cách mạng Pháp',
    startYear: 1789,
    endYear: 1799,
    regionCode: 'FRANCE',
    periodTypeCode: 'HISTORICAL_ERA',
    description: 'Giai đoạn sụp đổ chế độ quân chủ chuyên chế Pháp và hình thành nền cộng hòa, từ Hội nghị Estates-General (1789) tới đảo chính 18 Brumaire (1799).',
  });
  await upsertPeriod({
    slug: 'de-nhat-cong-hoa-phap',
    name: 'Đệ nhất Cộng hòa Pháp',
    startYear: 1792,
    endYear: 1799,
    regionCode: 'FRANCE',
    periodTypeCode: 'POLITICAL_REGIME',
    parentSlug: 'cach-mang-phap',
    description: 'Chính thể cộng hòa đầu tiên của Pháp, thành lập sau khi bãi bỏ quân chủ năm 1792.',
  });

  const personsC: EntityInput[] = [
    { slug: 'louis-xvi', name: 'Louis XVI', type: HistoricalEntityType.PERSON, tagline: 'Vua Pháp cuối cùng trước Cách mạng, bị xử tử năm 1793', isFeatured: true },
    { slug: 'marie-antoinette', name: 'Marie Antoinette', type: HistoricalEntityType.PERSON, tagline: 'Vương hậu Pháp, bị xử tử năm 1793' },
    { slug: 'maximilien-robespierre', name: 'Maximilien Robespierre', type: HistoricalEntityType.PERSON, tagline: 'Lãnh đạo chủ chốt Ủy ban An toàn Công cộng, Thời kỳ Khủng bố', isFeatured: true },
    { slug: 'georges-danton', name: 'Georges Danton', type: HistoricalEntityType.PERSON, tagline: 'Lãnh đạo cách mạng, bị xử tử năm 1794' },
    { slug: 'jean-paul-marat', name: 'Jean-Paul Marat', type: HistoricalEntityType.PERSON, tagline: 'Nhà báo, chính trị gia cực đoan cách mạng Pháp' },
    { slug: 'napoleon-bonaparte', name: 'Napoleon Bonaparte', type: HistoricalEntityType.PERSON, tagline: 'Tướng chỉ huy đảo chính 18 Brumaire 1799', isFeatured: true },
    { slug: 'jacques-necker', name: 'Jacques Necker', type: HistoricalEntityType.PERSON, tagline: 'Tổng trưởng Tài chính triều Louis XVI' },
    { slug: 'lafayette', name: 'Marquis de Lafayette', type: HistoricalEntityType.PERSON, tagline: 'Chỉ huy Vệ binh Quốc gia, đại biểu Quốc hội Lập hiến' },
  ];
  for (const p of personsC) {
    const e = await upsertEntity(p);
    await upsertPerson(e.id, { biography: p.tagline });
  }

  await Promise.all([
    upsertEntity({ slug: 'vuong-quoc-phap', name: 'Vương quốc Pháp', type: HistoricalEntityType.ORGANIZATION, tagline: 'Chế độ quân chủ Pháp trước Cách mạng' }),
    upsertEntity({ slug: 'de-nhat-cong-hoa-phap-entity', name: 'Đệ nhất Cộng hòa Pháp (thể chế)', type: HistoricalEntityType.ORGANIZATION, tagline: 'Thể chế cộng hòa thành lập năm 1792' }),
    upsertEntity({ slug: 'estates-general', name: 'Estates-General', type: HistoricalEntityType.ORGANIZATION, tagline: 'Hội nghị 3 đẳng cấp triệu tập năm 1789' }),
    upsertEntity({ slug: 'quoc-hoi-lap-hien-phap', name: 'Quốc hội Lập hiến', type: HistoricalEntityType.ORGANIZATION, tagline: 'Assemblée nationale constituante (1789-1791)' }),
    upsertEntity({ slug: 'quoc-hoi-lap-phap-phap', name: 'Quốc hội Lập pháp', type: HistoricalEntityType.ORGANIZATION, tagline: 'Assemblée législative (1791-1792)' }),
    upsertEntity({ slug: 'convention-quoc-gia', name: 'Convention Quốc gia', type: HistoricalEntityType.ORGANIZATION, tagline: 'Convention nationale (1792-1795)' }),
    upsertEntity({ slug: 'uy-ban-an-toan-cong-cong', name: 'Ủy ban An toàn Công cộng', type: HistoricalEntityType.ORGANIZATION, tagline: 'Comité de salut public, cơ quan quyền lực thời kỳ Khủng bố' }),
  ]);

  const sitesC: Array<{ slug: string; name: string; siteTypeCode: string; tagline: string }> = [
    { slug: 'paris-1789', name: 'Paris', siteTypeCode: 'OTHER_SITE', tagline: 'Thủ đô Pháp, trung tâm Cách mạng Pháp' },
    { slug: 'versailles', name: 'Versailles', siteTypeCode: 'PALACE', tagline: 'Cung điện hoàng gia, nơi họp Estates-General' },
    { slug: 'nguc-bastille', name: 'Ngục Bastille', siteTypeCode: 'PRISON_DETENTION', tagline: 'Pháo đài - nhà tù bị quần chúng chiếm ngày 14/07/1789' },
    { slug: 'lyon-1789', name: 'Lyon', siteTypeCode: 'OTHER_SITE', tagline: 'Thành phố lớn, trung tâm các cuộc nổi dậy chống Convention' },
    { slug: 'toulon-1789', name: 'Toulon', siteTypeCode: 'OTHER_SITE', tagline: 'Cảng quân sự, nơi Napoleon Bonaparte khởi đầu binh nghiệp 1793' },
  ];
  for (const s of sitesC) {
    const e = await upsertEntity({ slug: s.slug, name: s.name, type: HistoricalEntityType.LOCATION, tagline: s.tagline });
    await upsertSite(e.id, { siteTypeCode: s.siteTypeCode });
  }

  await upsertEvent({ slug: 'hoi-nghi-estates-general', title: 'Hội nghị Estates-General', startYear: 1789, startMonth: 5, startDay: 5, datePrecision: DatePrecision.DAY, summary: 'Louis XVI triệu tập hội nghị 3 đẳng cấp để giải quyết khủng hoảng tài chính.', categoryCodes: ['CONFERENCE'], locationSlug: 'versailles' });
  await upsertEvent({ slug: 'loi-the-san-quan-vot', title: 'Lời thề sân quần vợt', startYear: 1789, startMonth: 6, startDay: 20, datePrecision: DatePrecision.DAY, summary: 'Đại biểu Đẳng cấp thứ ba tuyên thệ không giải tán cho tới khi có hiến pháp mới.', categoryCodes: ['DECLARATION'], locationSlug: 'versailles' });
  await upsertEvent({ slug: 'chiem-nguc-bastille', title: 'Chiếm ngục Bastille', startYear: 1789, startMonth: 7, startDay: 14, datePrecision: DatePrecision.DAY, summary: 'Quần chúng Paris chiếm pháo đài - nhà tù Bastille, mở đầu Cách mạng Pháp.', categoryCodes: ['UPRISING'], locationSlug: 'nguc-bastille' });
  await upsertEvent({ slug: 'tuyen-ngon-nhan-quyen-1789', title: 'Tuyên ngôn Nhân quyền và Dân quyền', startYear: 1789, startMonth: 8, startDay: 26, datePrecision: DatePrecision.DAY, summary: 'Quốc hội Lập hiến thông qua Tuyên ngôn Nhân quyền và Dân quyền.', categoryCodes: ['DECLARATION'] });
  await upsertEvent({ slug: 'hanh-quan-versailles', title: 'Hành quân đến Versailles', startYear: 1789, startMonth: 10, startDay: 5, datePrecision: DatePrecision.DAY, summary: 'Phụ nữ Paris hành quân đến Versailles, buộc Louis XVI về Paris.', categoryCodes: ['UPRISING'], locationSlug: 'versailles' });
  await upsertEvent({ slug: 'thanh-lap-de-nhat-cong-hoa', title: 'Thành lập Đệ nhất Cộng hòa Pháp', startYear: 1792, startMonth: 9, startDay: 22, datePrecision: DatePrecision.DAY, summary: 'Convention Quốc gia tuyên bố bãi bỏ quân chủ, thành lập nền cộng hòa.', categoryCodes: ['FOUNDATION'] });
  await upsertEvent({ slug: 'xu-tu-louis-xvi', title: 'Xử tử Louis XVI', startYear: 1793, startMonth: 1, startDay: 21, datePrecision: DatePrecision.DAY, summary: 'Louis XVI bị xử tử bằng máy chém tại Paris.', categoryCodes: ['POLITICAL_EVENT'], locationSlug: 'paris-1789' });
  await upsertEvent({ slug: 'thoi-ky-khung-bo', title: 'Thời kỳ Khủng bố', startYear: 1793, endYear: 1794, datePrecision: DatePrecision.YEAR, summary: 'Giai đoạn Ủy ban An toàn Công cộng dưới sự lãnh đạo của Robespierre thực hiện hàng loạt vụ xử tử.', categoryCodes: ['POLITICAL_EVENT'] });
  await upsertEvent({ slug: 'dao-chinh-18-brumaire', title: 'Đảo chính 18 Brumaire', startYear: 1799, startMonth: 11, startDay: 9, datePrecision: DatePrecision.DAY, summary: 'Napoleon Bonaparte lật đổ Directory, mở đường lập chế độ Tổng tài.', categoryCodes: ['COUP'] });

  for (const evt of [
    'hoi-nghi-estates-general',
    'loi-the-san-quan-vot',
    'chiem-nguc-bastille',
    'tuyen-ngon-nhan-quyen-1789',
    'hanh-quan-versailles',
  ]) {
    await linkEventPeriod(evt, 'cach-mang-phap');
  }
  for (const evt of ['thanh-lap-de-nhat-cong-hoa', 'xu-tu-louis-xvi', 'thoi-ky-khung-bo', 'dao-chinh-18-brumaire']) {
    // Nối period con (cụ thể hơn) TRƯỚC — linkEventPeriod chỉ set cột period_id trực
    // tiếp 1 lần duy nhất (event chưa có periodId), nên thứ tự quyết định event cuối
    // cùng trỏ periodId vào thời kỳ con hay thời kỳ cha. Period con phải thắng, vì
    // trang Dòng thời gian (sk-adapter.ts) chỉ nhóm sự kiện theo thời kỳ CON (leaf).
    await linkEventPeriod(evt, 'de-nhat-cong-hoa-phap');
    await linkEventPeriod(evt, 'cach-mang-phap');
  }

  await addParticipant({ eventSlug: 'hoi-nghi-estates-general', entitySlug: 'louis-xvi', roleCode: 'OTHER_ROLE', isPrimary: true, roleLabelOverride: 'Nhà vua triệu tập hội nghị' });
  await addParticipant({ eventSlug: 'hoi-nghi-estates-general', entitySlug: 'jacques-necker', roleCode: 'OTHER_ROLE', roleLabelOverride: 'Tổng trưởng Tài chính' });
  await addParticipant({ eventSlug: 'loi-the-san-quan-vot', entitySlug: 'lafayette', roleCode: 'PARTICIPANT', roleLabelOverride: 'Đại biểu Đẳng cấp thứ ba' });
  await addParticipant({ eventSlug: 'xu-tu-louis-xvi', entitySlug: 'louis-xvi', roleCode: 'VICTIM', isPrimary: true });
  await addParticipant({ eventSlug: 'thoi-ky-khung-bo', entitySlug: 'marie-antoinette', roleCode: 'VICTIM', roleLabelOverride: 'Bị hành hình trong Thời kỳ Khủng bố' });
  await addParticipant({ eventSlug: 'thoi-ky-khung-bo', entitySlug: 'maximilien-robespierre', roleCode: 'COMMANDER', isPrimary: true, roleLabelOverride: 'Lãnh đạo Ủy ban An toàn Công cộng' });
  await addParticipant({ eventSlug: 'thoi-ky-khung-bo', entitySlug: 'georges-danton', roleCode: 'PARTICIPANT' });
  await addParticipant({ eventSlug: 'thoi-ky-khung-bo', entitySlug: 'jean-paul-marat', roleCode: 'PARTICIPANT' });
  await addParticipant({ eventSlug: 'dao-chinh-18-brumaire', entitySlug: 'napoleon-bonaparte', roleCode: 'COMMANDER', isPrimary: true });
  await addParticipant({ eventSlug: 'tuyen-ngon-nhan-quyen-1789', entitySlug: 'lafayette', roleCode: 'PARTICIPANT', roleLabelOverride: 'Đại biểu soạn thảo' });

  await addStatement({ subject: { kind: 'entity', slug: 'louis-xvi' }, predicateCode: 'RULED', object: { kind: 'entity', slug: 'vuong-quoc-phap' }, validFromYear: 1774, validToYear: 1792, isPrimary: true, referenceSlugs: [{ refCode: 'BRITANNICA_FR' }] });
  await addStatement({ subject: { kind: 'entity', slug: 'marie-antoinette' }, predicateCode: 'SPOUSE_OF', object: { kind: 'entity', slug: 'louis-xvi' }, qualifiers: { marriageYear: 1770 } });
  await addStatement({ subject: { kind: 'entity', slug: 'maximilien-robespierre' }, predicateCode: 'MEMBER_OF', object: { kind: 'entity', slug: 'uy-ban-an-toan-cong-cong' }, qualifiers: { role: 'Lãnh đạo chủ chốt', joinYear: 1793 }, isPrimary: true });
  await addStatement({ subject: { kind: 'entity', slug: 'lafayette' }, predicateCode: 'MEMBER_OF', object: { kind: 'entity', slug: 'quoc-hoi-lap-hien-phap' } });
  await addStatement({ subject: { kind: 'entity', slug: 'jean-paul-marat' }, predicateCode: 'ALLY_OF', object: { kind: 'entity', slug: 'maximilien-robespierre' }, qualifiers: { context: 'Phe Jacobins cực đoan' } });
  await addStatement({ subject: { kind: 'entity', slug: 'convention-quoc-gia' }, predicateCode: 'FOUNDED', object: { kind: 'entity', slug: 'de-nhat-cong-hoa-phap-entity' }, validFromYear: 1792, referenceSlugs: [{ refCode: 'BRITANNICA_FR' }] });
  await addStatement({ subject: { kind: 'entity', slug: 'quoc-hoi-lap-hien-phap' }, predicateCode: 'PARTICIPATED_IN', object: { kind: 'event', slug: 'tuyen-ngon-nhan-quyen-1789' }, qualifiers: { role: 'Thông qua và ban hành' }, referenceSlugs: [{ refCode: 'DDHC_1789' }] });
  await addStatement({ subject: { kind: 'event', slug: 'chiem-nguc-bastille' }, predicateCode: 'OCCURRED_AT', object: { kind: 'entity', slug: 'nguc-bastille' }, referenceSlugs: [{ refCode: 'BRITANNICA_FR' }] });
  await addStatement({ subject: { kind: 'event', slug: 'loi-the-san-quan-vot' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'hoi-nghi-estates-general' } });
  await addStatement({ subject: { kind: 'event', slug: 'chiem-nguc-bastille' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'loi-the-san-quan-vot' } });
  await addStatement({ subject: { kind: 'event', slug: 'tuyen-ngon-nhan-quyen-1789' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'chiem-nguc-bastille' } });
  await addStatement({ subject: { kind: 'event', slug: 'hanh-quan-versailles' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'tuyen-ngon-nhan-quyen-1789' } });
  await addStatement({ subject: { kind: 'event', slug: 'thanh-lap-de-nhat-cong-hoa' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'hanh-quan-versailles' } });
  await addStatement({ subject: { kind: 'event', slug: 'xu-tu-louis-xvi' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'thanh-lap-de-nhat-cong-hoa' } });
  await addStatement({ subject: { kind: 'event', slug: 'thoi-ky-khung-bo' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'xu-tu-louis-xvi' } });
  await addStatement({ subject: { kind: 'event', slug: 'dao-chinh-18-brumaire' }, predicateCode: 'PRECEDED_BY', object: { kind: 'event', slug: 'thoi-ky-khung-bo' } });

  console.log('✅ Cụm C (Cách mạng Pháp) hoàn tất.');

  console.log('🎉 Hoàn thành Seed Pilot v1.0!');
}

if (require.main === module) {
  seedPilotV1()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
