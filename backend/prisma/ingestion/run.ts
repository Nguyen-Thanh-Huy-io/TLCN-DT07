/**
 * Runner Phase 4 — đọc 4 catalog tĩnh (period/entities/events/relations) và
 * ghi thẳng vào Postgres qua Prisma, idempotent theo slug (upsert), không
 * cần gọi API ngoài. Chạy: `npx ts-node prisma/ingestion/run.ts`.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PeriodCatalogBuilder } from './catalogs/period.catalog';
import { EntityCatalogBuilder } from './catalogs/entities.catalog';
import { EventCatalogBuilder } from './catalogs/events.catalog';
import { RAW_RELATIONS } from './catalogs/relations.catalog';
import { BATCH_03_EVENTS } from './catalogs/events.batch-03.catalog';
import { BATCH_03_RELATIONS } from './catalogs/relations.batch-03.catalog';
import { FIGURE_PROFILES } from './catalogs/figure-profiles.catalog';
import { IEntitySeedRecord, IRelationsSeedDataset } from './interfaces/ingestion.interface';

const RELATIONS: IRelationsSeedDataset = {
  eventEntityRelations: [...RAW_RELATIONS.eventEntityRelations, ...BATCH_03_RELATIONS.eventEntityRelations],
  entityRelations: [...RAW_RELATIONS.entityRelations, ...BATCH_03_RELATIONS.entityRelations],
  eventCausalRelations: [...RAW_RELATIONS.eventCausalRelations, ...BATCH_03_RELATIONS.eventCausalRelations],
};

// Gộp hồ sơ batch 03 vào bản ghi nhân vật: roles → Person.roles, profile → metadata.profile.
function withFigureProfile(e: IEntitySeedRecord): IEntitySeedRecord {
  const seed = FIGURE_PROFILES[e.slug];
  if (e.type !== 'PERSON' || !seed) return e;
  return {
    ...e,
    metadata: seed.profile ? { ...e.metadata, profile: seed.profile } : e.metadata,
    person: e.person ? { ...e.person, roles: seed.roles } : e.person,
  };
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== PHASE 4 RUNNER: ghi catalogs vào DB ===');

  // ---------- 1. PERIODS ----------
  const periods = PeriodCatalogBuilder.buildCatalog();
  const periodSlugToId = new Map<string, string>();

  for (const p of periods) {
    const parentId = p.parentSlug ? periodSlugToId.get(p.parentSlug) ?? null : null;
    const row = await prisma.period.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        parentId,
        startYear: p.startYear,
        endYear: p.endYear,
        timeLabel: p.timeLabel,
        datePrecision: p.datePrecision,
        region: p.region,
        description: p.description,
        coverImageUrl: p.coverImageUrl,
        displayOrder: p.displayOrder,
        status: p.status,
      },
      create: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        parentId,
        startYear: p.startYear,
        endYear: p.endYear,
        timeLabel: p.timeLabel,
        datePrecision: p.datePrecision,
        region: p.region,
        description: p.description,
        coverImageUrl: p.coverImageUrl,
        displayOrder: p.displayOrder,
        status: p.status,
      },
    });
    periodSlugToId.set(p.slug, row.id);
  }
  console.log(`✓ Periods: ${periods.length}`);

  // ---------- 2. ENTITIES ----------
  const entities = EntityCatalogBuilder.buildCatalog().map(withFigureProfile);
  const entitySlugToId = new Map<string, string>();

  for (const e of entities) {
    const periodId = e.periodSlug ? periodSlugToId.get(e.periodSlug) ?? null : null;
    const row = await prisma.historicalEntity.upsert({
      where: { slug: e.slug },
      update: {
        name: e.name,
        type: e.type,
        tagline: e.tagline,
        description: e.description,
        aliases: e.aliases,
        imageUrl: e.imageUrl,
        imageCaption: e.imageCaption,
        metadata: e.metadata,
        isFeatured: e.isFeatured,
        displayOrder: e.displayOrder,
        status: e.status,
        periodId,
      },
      create: {
        slug: e.slug,
        name: e.name,
        type: e.type,
        tagline: e.tagline,
        description: e.description,
        aliases: e.aliases,
        imageUrl: e.imageUrl,
        imageCaption: e.imageCaption,
        metadata: e.metadata,
        isFeatured: e.isFeatured,
        displayOrder: e.displayOrder,
        status: e.status,
        periodId,
      },
    });
    entitySlugToId.set(e.slug, row.id);

    if (e.type === 'PERSON' && e.person) {
      await prisma.person.upsert({
        where: { entityId: row.id },
        update: { ...e.person },
        create: { entityId: row.id, ...e.person },
      });
    }
    if (e.type === 'LOCATION' && e.historicalSite) {
      await prisma.historicalSite.upsert({
        where: { entityId: row.id },
        update: { ...e.historicalSite },
        create: { entityId: row.id, ...e.historicalSite },
      });
    }
  }
  console.log(`✓ Entities: ${entities.length}`);

  // ---------- 3. EVENTS (2 lượt: tạo trước, gắn parentId sau) ----------
  const events = [...EventCatalogBuilder.buildCatalog(), ...BATCH_03_EVENTS];
  const eventSlugToId = new Map<string, string>();

  for (const ev of events) {
    const periodId = ev.periodSlug ? periodSlugToId.get(ev.periodSlug) ?? null : null;
    const locationId = ev.locationSlug ? entitySlugToId.get(ev.locationSlug) ?? null : null;
    const row = await prisma.historicalEvent.upsert({
      where: { slug: ev.slug },
      update: {
        title: ev.title,
        startYear: ev.startYear,
        startMonth: ev.startMonth,
        startDay: ev.startDay,
        endYear: ev.endYear,
        endMonth: ev.endMonth,
        endDay: ev.endDay,
        eventDateNote: ev.eventDateNote,
        summary: ev.summary,
        description: ev.description,
        thumbnailUrl: ev.thumbnailUrl,
        displayOrder: ev.displayOrder,
        category: ev.category,
        metadata: ev.metadata,
        status: ev.status,
        periodId,
        locationId,
      },
      create: {
        slug: ev.slug,
        title: ev.title,
        startYear: ev.startYear,
        startMonth: ev.startMonth,
        startDay: ev.startDay,
        endYear: ev.endYear,
        endMonth: ev.endMonth,
        endDay: ev.endDay,
        eventDateNote: ev.eventDateNote,
        summary: ev.summary,
        description: ev.description,
        thumbnailUrl: ev.thumbnailUrl,
        displayOrder: ev.displayOrder,
        category: ev.category,
        metadata: ev.metadata,
        status: ev.status,
        periodId,
        locationId,
      },
    });
    eventSlugToId.set(ev.slug, row.id);
  }

  for (const ev of events) {
    if (!ev.parentSlug) continue;
    const parentId = eventSlugToId.get(ev.parentSlug);
    if (!parentId) {
      console.warn(`⚠ Không tìm thấy parentSlug="${ev.parentSlug}" cho event "${ev.slug}"`);
      continue;
    }
    await prisma.historicalEvent.update({
      where: { slug: ev.slug },
      data: { parentId },
    });
  }
  console.log(`✓ Events: ${events.length}`);

  // ---------- 4. RELATIONS ----------
  let eeCount = 0;
  for (const r of RELATIONS.eventEntityRelations) {
    const eventId = eventSlugToId.get(r.eventSlug);
    const entityId = entitySlugToId.get(r.entitySlug);
    if (!eventId || !entityId) {
      console.warn(`⚠ Bỏ qua eventEntityRelation (thiếu id): ${r.eventSlug} / ${r.entitySlug}`);
      continue;
    }
    await prisma.historicalEventEntity.upsert({
      where: { eventId_entityId: { eventId, entityId } },
      update: { role: r.role, roleLabel: r.roleLabel, isPrimary: r.isPrimary, displayOrder: r.displayOrder, notes: r.notes },
      create: { eventId, entityId, role: r.role, roleLabel: r.roleLabel, isPrimary: r.isPrimary, displayOrder: r.displayOrder, notes: r.notes },
    });
    eeCount++;
  }
  console.log(`✓ HistoricalEventEntity: ${eeCount}`);

  let erCount = 0;
  for (const r of RELATIONS.entityRelations) {
    const sourceEntityId = entitySlugToId.get(r.sourceEntitySlug);
    const targetEntityId = entitySlugToId.get(r.targetEntitySlug);
    if (!sourceEntityId || !targetEntityId) {
      console.warn(`⚠ Bỏ qua entityRelation (thiếu id): ${r.sourceEntitySlug} / ${r.targetEntitySlug}`);
      continue;
    }
    await prisma.historicalEntityRelation.upsert({
      where: {
        sourceEntityId_targetEntityId_relationType: {
          sourceEntityId,
          targetEntityId,
          relationType: r.relationType,
        },
      },
      update: { startYear: r.startYear, endYear: r.endYear, note: r.note },
      create: {
        sourceEntityId,
        targetEntityId,
        relationType: r.relationType,
        startYear: r.startYear,
        endYear: r.endYear,
        note: r.note,
      },
    });
    erCount++;
  }
  console.log(`✓ HistoricalEntityRelation: ${erCount}`);

  let evrCount = 0;
  for (const r of RELATIONS.eventCausalRelations) {
    const sourceEventId = eventSlugToId.get(r.sourceEventSlug);
    const targetEventId = eventSlugToId.get(r.targetEventSlug);
    if (!sourceEventId || !targetEventId) {
      console.warn(`⚠ Bỏ qua eventCausalRelation (thiếu id): ${r.sourceEventSlug} / ${r.targetEventSlug}`);
      continue;
    }
    await prisma.historicalEventRelation.upsert({
      where: {
        sourceEventId_targetEventId_relationType: {
          sourceEventId,
          targetEventId,
          relationType: r.relationType,
        },
      },
      update: { description: r.description, status: r.status, sourceReference: r.sourceReference },
      create: {
        sourceEventId,
        targetEventId,
        relationType: r.relationType,
        description: r.description,
        status: r.status,
        sourceReference: r.sourceReference,
      },
    });
    evrCount++;
  }
  console.log(`✓ HistoricalEventRelation: ${evrCount}`);

  console.log('=== HOÀN TẤT ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
