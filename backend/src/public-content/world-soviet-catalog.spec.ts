import { PeriodCatalogBuilder } from '../../prisma/ingestion/catalogs/period.catalog';
import {
  ENTITY_RELATION_CODES,
  EVENT_ENTITY_ROLES,
  HISTORICAL_REGIONS,
  HistoricalRegion,
  PERIOD_SLUGS,
} from '../../prisma/ingestion/constants/ingestion.constants';
import { CatalogProviderRegistry } from '../../prisma/ingestion/strategies/catalog-provider.registry';
import { PeriodResolutionStrategyRegistry } from '../../prisma/ingestion/strategies/period-resolution.strategies';

describe('Multi-Region Historical Catalog & Strategy Validation (Vietnam, World, Soviet Union)', () => {
  describe('PeriodResolutionStrategyRegistry (Strategy + Registry Pattern)', () => {
    it('định tuyến chính xác niên đại lịch sử Việt Nam', () => {
      expect(
        PeriodResolutionStrategyRegistry.resolve(
          -500,
          HistoricalRegion.VIETNAM,
        ),
      ).toBe(PERIOD_SLUGS.VN_HONG_BANG);
      expect(
        PeriodResolutionStrategyRegistry.resolve(40, HistoricalRegion.VIETNAM),
      ).toBe(PERIOD_SLUGS.VN_TRUNG_SISTERS);
      expect(
        PeriodResolutionStrategyRegistry.resolve(
          1968,
          HistoricalRegion.NATIONWIDE,
        ),
      ).toBe(PERIOD_SLUGS.VN_ANTI_US_WAR);
      expect(
        PeriodResolutionStrategyRegistry.resolve(
          1986,
          HistoricalRegion.VIETNAM,
        ),
      ).toBe(PERIOD_SLUGS.VN_SRVN_DOI_MOI);
    });

    it('định tuyến chính xác niên đại lịch sử Liên Xô (1917 - 1991)', () => {
      expect(
        PeriodResolutionStrategyRegistry.resolve(
          1917,
          HistoricalRegion.SOVIET_UNION,
        ),
      ).toBe(PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR);
      expect(
        PeriodResolutionStrategyRegistry.resolve(
          1943,
          HistoricalRegion.SOVIET_UNION,
        ),
      ).toBe(PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR);
      expect(
        PeriodResolutionStrategyRegistry.resolve(
          1961,
          HistoricalRegion.SOVIET_UNION,
        ),
      ).toBe(PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA);
      expect(
        PeriodResolutionStrategyRegistry.resolve(
          1991,
          HistoricalRegion.SOVIET_UNION,
        ),
      ).toBe(PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA);
    });

    it('định tuyến chính xác niên đại lịch sử Thế giới (Trung đại, Cận đại, Hiện đại)', () => {
      expect(
        PeriodResolutionStrategyRegistry.resolve(1492, HistoricalRegion.WORLD),
      ).toBe(PERIOD_SLUGS.WORLD_MEDIEVAL_EUROPE);
      expect(
        PeriodResolutionStrategyRegistry.resolve(1789, HistoricalRegion.WORLD),
      ).toBe(PERIOD_SLUGS.WORLD_BOURGEOIS_REVOLUTIONS);
      expect(
        PeriodResolutionStrategyRegistry.resolve(1868, HistoricalRegion.WORLD),
      ).toBe(PERIOD_SLUGS.WORLD_INDUSTRIAL_MEIJI);
      expect(
        PeriodResolutionStrategyRegistry.resolve(1944, HistoricalRegion.WORLD),
      ).toBe(PERIOD_SLUGS.WORLD_TWO_WORLD_WARS);
      expect(
        PeriodResolutionStrategyRegistry.resolve(1989, HistoricalRegion.WORLD),
      ).toBe(PERIOD_SLUGS.WORLD_COLD_WAR_MULTIPOLAR);
    });

    it('tương thích ngược với PeriodCatalogBuilder.resolvePeriodSlug(year, boolean | HistoricalRegion)', () => {
      expect(PeriodCatalogBuilder.resolvePeriodSlug(1945, true)).toBe(
        PERIOD_SLUGS.VN_FRENCH_COLONIAL,
      );
      expect(PeriodCatalogBuilder.resolvePeriodSlug(1945, false)).toBe(
        PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
      );
      expect(
        PeriodCatalogBuilder.resolvePeriodSlug(
          1957,
          HistoricalRegion.SOVIET_UNION,
        ),
      ).toBe(PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA);
    });
  });

  describe('CatalogProviderRegistry & Referential Integrity (Composite Pattern)', () => {
    const dataset = CatalogProviderRegistry.getAggregatedDataset();
    const periodSlugs = new Set(dataset.periods.map((p) => p.slug));
    const entitySlugs = new Set(dataset.entities.map((e) => e.slug));
    const eventSlugs = new Set(dataset.events.map((ev) => ev.slug));

    it('chứa đầy đủ các giai đoạn của Việt Nam, Thế giới và Liên Xô', () => {
      const regions = new Set(dataset.periods.map((p) => p.region));
      expect(regions.has(HISTORICAL_REGIONS.VIETNAM)).toBe(true);
      expect(regions.has(HISTORICAL_REGIONS.WORLD)).toBe(true);
      expect(regions.has(HISTORICAL_REGIONS.SOVIET_UNION)).toBe(true);

      const sovietPeriods = dataset.periods.filter(
        (p) => p.region === HISTORICAL_REGIONS.SOVIET_UNION,
      );
      expect(sovietPeriods.length).toBe(2);
      expect(
        sovietPeriods.every(
          (p) => p.parentSlug === PERIOD_SLUGS.WORLD_MODERN_ERA,
        ),
      ).toBe(true);
    });

    it('đảm bảo tính duy nhất của slug trong Periods, Entities và Events', () => {
      expect(periodSlugs.size).toBe(dataset.periods.length);
      expect(entitySlugs.size).toBe(dataset.entities.length);
      expect(eventSlugs.size).toBe(dataset.events.length);
    });

    it('mọi Entity đều trỏ tới periodSlug hợp lệ và nhân vật Thế giới/Liên Xô được gộp FigureProfile', () => {
      for (const entity of dataset.entities) {
        if (entity.periodSlug) {
          expect(periodSlugs.has(entity.periodSlug)).toBe(true);
        }
      }

      const lenin = dataset.entities.find(
        (e) => e.slug === 'vladimir-ilyich-lenin',
      );
      expect(lenin).toBeDefined();
      expect(lenin?.person?.roles?.length).toBeGreaterThan(0);
      expect(lenin?.metadata?.profile?.famousQuote).toContain('Học, học nữa');

      const gagarin = dataset.entities.find((e) => e.slug === 'yuri-gagarin');
      expect(gagarin).toBeDefined();
      expect(gagarin?.metadata?.profile?.famousQuote).toContain('Poyekhali');
    });

    it('mọi Event đều trỏ tới periodSlug, locationSlug và parentSlug hợp lệ', () => {
      for (const ev of dataset.events) {
        expect(ev.periodSlug).toBeDefined();
        expect(periodSlugs.has(ev.periodSlug!)).toBe(true);

        if (ev.locationSlug) {
          expect(entitySlugs.has(ev.locationSlug)).toBe(true);
        }
        if (ev.parentSlug) {
          expect(eventSlugs.has(ev.parentSlug)).toBe(true);
        }
      }
    });

    it('mọi liên kết trong Đồ thị Tri thức (Relations) đều trỏ tới thực thể/sự kiện tồn tại và dùng đúng mã chuẩn', () => {
      const validEntityRoles = new Set<string>(
        Object.values(EVENT_ENTITY_ROLES),
      );
      const validEntityRelationCodes = new Set<string>(
        Object.values(ENTITY_RELATION_CODES),
      );

      for (const rel of dataset.relations.eventEntityRelations) {
        expect(eventSlugs.has(rel.eventSlug)).toBe(true);
        expect(entitySlugs.has(rel.entitySlug)).toBe(true);
        expect(validEntityRoles.has(rel.role)).toBe(true);
      }

      for (const rel of dataset.relations.entityRelations) {
        expect(entitySlugs.has(rel.sourceEntitySlug)).toBe(true);
        expect(entitySlugs.has(rel.targetEntitySlug)).toBe(true);
        expect(validEntityRelationCodes.has(rel.relationType)).toBe(true);
      }

      for (const rel of dataset.relations.eventCausalRelations) {
        expect(eventSlugs.has(rel.sourceEventSlug)).toBe(true);
        expect(eventSlugs.has(rel.targetEventSlug)).toBe(true);
      }
    });

    it('sự kiện khoi-nghia-ly-bi được làm đầy toàn diện thông tin, địa danh, hình ảnh và đồ thị quan hệ', () => {
      const event = dataset.events.find((ev) => ev.slug === 'khoi-nghia-ly-bi');
      expect(event).toBeDefined();
      expect(event?.locationSlug).toBe('thanh-long-bien');
      expect(event?.thumbnailUrl).toBeTruthy();
      expect(event?.summary.length).toBeGreaterThan(150);
      expect(event?.description.length).toBeGreaterThan(500);

      const metadata = event?.metadata as any;
      expect(metadata).toBeDefined();
      expect(metadata.cause).toContain('Tiêu Tư');
      expect(metadata.cause).toContain('Tinh Thiều');
      expect(metadata.outcome).toContain('Vạn Xuân');
      expect(metadata.sources.length).toBeGreaterThanOrEqual(5);

      // Kiểm tra thực thể địa danh thành Long Biên
      const longBien = dataset.entities.find(
        (e) => e.slug === 'thanh-long-bien',
      );
      expect(longBien).toBeDefined();
      expect(longBien?.type).toBe('LOCATION');
      expect(longBien?.historicalSite?.siteType).toContain('Thành lũy');

      // Kiểm tra các nhân vật và địa danh tham gia sự kiện
      const eventEntities = dataset.relations.eventEntityRelations.filter(
        (r) => r.eventSlug === 'khoi-nghia-ly-bi',
      );
      const participantSlugs = new Set(eventEntities.map((r) => r.entitySlug));
      expect(participantSlugs.has('thanh-long-bien')).toBe(true);
      expect(participantSlugs.has('ly-bi')).toBe(true);
      expect(participantSlugs.has('pham-tu')).toBe(true);
      expect(participantSlugs.has('tinh-thieu')).toBe(true);
      expect(participantSlugs.has('trieu-quang-phuc')).toBe(true);

      // Kiểm tra mối liên hệ nhân - quả với sự kiện lập nước Vạn Xuân
      const causal = dataset.relations.eventCausalRelations.find(
        (r) =>
          r.sourceEventSlug === 'khoi-nghia-ly-bi' &&
          r.targetEventSlug === 'ly-nam-de-lap-nuoc-van-xuan',
      );
      expect(causal).toBeDefined();
    });
  });
});
