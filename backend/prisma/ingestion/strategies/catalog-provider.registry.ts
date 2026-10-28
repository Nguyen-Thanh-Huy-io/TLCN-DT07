import { BATCH_03_EVENTS } from '../catalogs/events.batch-03.catalog';
import { EntityCatalogBuilder } from '../catalogs/entities.catalog';
import { EventCatalogBuilder } from '../catalogs/events.catalog';
import {
  FIGURE_PROFILES,
  IFigureProfileSeed,
} from '../catalogs/figure-profiles.catalog';
import { PeriodCatalogBuilder } from '../catalogs/period.catalog';
import { BATCH_03_RELATIONS } from '../catalogs/relations.batch-03.catalog';
import { RAW_RELATIONS } from '../catalogs/relations.catalog';
import {
  WORLD_SOVIET_FIGURE_PROFILES,
  WorldAndSovietCatalogProvider,
} from '../catalogs/world-soviet.catalog';
import { HISTORICAL_REGIONS } from '../constants/ingestion.constants';
import {
  ICatalogDatasetProvider,
  ICompleteHistoricalDataset,
  IEntitySeedRecord,
  IEventSeedRecord,
  IRelationsSeedDataset,
} from '../interfaces/ingestion.interface';

/**
 * Concrete Dataset Provider cho Lịch sử Việt Nam (SRP / OCP)
 */
export class VietnamHistoryCatalogProvider implements ICatalogDatasetProvider {
  public readonly regionName = HISTORICAL_REGIONS.VIETNAM;

  public getEntities(): IEntitySeedRecord[] {
    return EntityCatalogBuilder.buildCatalog();
  }

  public getEvents(): IEventSeedRecord[] {
    return [...EventCatalogBuilder.buildCatalog(), ...BATCH_03_EVENTS];
  }

  public getRelations(): IRelationsSeedDataset {
    return {
      eventEntityRelations: [
        ...RAW_RELATIONS.eventEntityRelations,
        ...BATCH_03_RELATIONS.eventEntityRelations,
      ],
      entityRelations: [
        ...RAW_RELATIONS.entityRelations,
        ...BATCH_03_RELATIONS.entityRelations,
      ],
      eventCausalRelations: [
        ...RAW_RELATIONS.eventCausalRelations,
        ...BATCH_03_RELATIONS.eventCausalRelations,
      ],
    };
  }
}

/**
 * Composite Registry gom toàn bộ các Provider khu vực (Việt Nam, Thế giới, Liên Xô...)
 * Đảm bảo Open-Closed Principle: khi thêm khu vực mới chỉ cần đăng ký Provider mới.
 */
export class CatalogProviderRegistry {
  private static readonly providers: ICatalogDatasetProvider[] = [
    new VietnamHistoryCatalogProvider(),
    new WorldAndSovietCatalogProvider(),
  ];

  private static readonly figureProfiles: Record<string, IFigureProfileSeed> = {
    ...FIGURE_PROFILES,
    ...WORLD_SOVIET_FIGURE_PROFILES,
  };

  public static withFigureProfile(e: IEntitySeedRecord): IEntitySeedRecord {
    const seed = this.figureProfiles[e.slug];
    if (e.type !== 'PERSON' || !seed) return e;
    return {
      ...e,
      metadata: seed.profile
        ? { ...e.metadata, profile: seed.profile }
        : e.metadata,
      person: e.person ? { ...e.person, roles: seed.roles } : e.person,
    };
  }

  public static getAggregatedDataset(): ICompleteHistoricalDataset {
    const periods = PeriodCatalogBuilder.buildCatalog();
    const entities = this.providers
      .flatMap((p) => p.getEntities())
      .map((e) => this.withFigureProfile(e));
    const events = this.providers.flatMap((p) => p.getEvents());

    const relations: IRelationsSeedDataset = {
      eventEntityRelations: this.providers.flatMap(
        (p) => p.getRelations().eventEntityRelations,
      ),
      entityRelations: this.providers.flatMap(
        (p) => p.getRelations().entityRelations,
      ),
      eventCausalRelations: this.providers.flatMap(
        (p) => p.getRelations().eventCausalRelations,
      ),
    };

    return {
      periods,
      entities,
      events,
      relations,
    };
  }
}
