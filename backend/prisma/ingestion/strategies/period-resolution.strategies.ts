import {
  HistoricalRegion,
  PERIOD_SLUGS,
} from '../constants/ingestion.constants';
import { IPeriodResolutionStrategy } from '../interfaces/ingestion.interface';

interface YearThresholdRule {
  maxYear: number;
  slug: string;
}

/**
 * 1. Strategy định tuyến niên đại Lịch sử Việt Nam (SRP / OCP)
 */
export class VietnamPeriodResolutionStrategy
  implements IPeriodResolutionStrategy
{
  private readonly rules: YearThresholdRule[] = [
    { maxYear: -208, slug: PERIOD_SLUGS.VN_HONG_BANG },
    { maxYear: 39, slug: PERIOD_SLUGS.VN_DOMINATION_1 },
    { maxYear: 43, slug: PERIOD_SLUGS.VN_TRUNG_SISTERS },
    { maxYear: 543, slug: PERIOD_SLUGS.VN_DOMINATION_2 },
    { maxYear: 602, slug: PERIOD_SLUGS.VN_EARLY_LY },
    { maxYear: 904, slug: PERIOD_SLUGS.VN_DOMINATION_3 },
    { maxYear: 938, slug: PERIOD_SLUGS.VN_AUTONOMY },
    { maxYear: 1009, slug: PERIOD_SLUGS.VN_NGO_DINH_TIEN_LE },
    { maxYear: 1225, slug: PERIOD_SLUGS.VN_LY_DYNASTY },
    { maxYear: 1399, slug: PERIOD_SLUGS.VN_TRAN_DYNASTY },
    { maxYear: 1427, slug: PERIOD_SLUGS.VN_HO_POST_TRAN_DOMINATION_4 },
    { maxYear: 1526, slug: PERIOD_SLUGS.VN_EARLY_LE },
    { maxYear: 1592, slug: PERIOD_SLUGS.VN_NORTH_SOUTH_COURTS },
    { maxYear: 1777, slug: PERIOD_SLUGS.VN_TRINH_NGUYEN },
    { maxYear: 1801, slug: PERIOD_SLUGS.VN_TAY_SON },
    { maxYear: 1882, slug: PERIOD_SLUGS.VN_NGUYEN_INDEPENDENT },
    { maxYear: 1945, slug: PERIOD_SLUGS.VN_FRENCH_COLONIAL },
    { maxYear: 1954, slug: PERIOD_SLUGS.VN_ANTI_FRENCH_WAR },
    { maxYear: 1975, slug: PERIOD_SLUGS.VN_ANTI_US_WAR },
  ];

  public supports(region: HistoricalRegion): boolean {
    return (
      region === HistoricalRegion.VIETNAM ||
      region === HistoricalRegion.NATIONWIDE
    );
  }

  public resolveSlug(year: number): string {
    for (const rule of this.rules) {
      if (year <= rule.maxYear) {
        return rule.slug;
      }
    }
    return PERIOD_SLUGS.VN_SRVN_DOI_MOI;
  }
}

/**
 * 2. Strategy định tuyến niên đại Lịch sử Liên Xô (1917 - 1991)
 */
export class SovietPeriodResolutionStrategy
  implements IPeriodResolutionStrategy
{
  public supports(region: HistoricalRegion): boolean {
    return region === HistoricalRegion.SOVIET_UNION;
  }

  public resolveSlug(year: number): string {
    if (year <= 1945) {
      return PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR;
    }
    return PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA;
  }
}

/**
 * 3. Strategy định tuyến niên đại Lịch sử Thế giới (Trung đại -> Cận đại -> Hiện đại)
 */
export class WorldPeriodResolutionStrategy
  implements IPeriodResolutionStrategy
{
  private readonly rules: YearThresholdRule[] = [
    { maxYear: 1492, slug: PERIOD_SLUGS.WORLD_MEDIEVAL_EUROPE },
    { maxYear: 1815, slug: PERIOD_SLUGS.WORLD_BOURGEOIS_REVOLUTIONS },
    { maxYear: 1913, slug: PERIOD_SLUGS.WORLD_INDUSTRIAL_MEIJI },
    { maxYear: 1945, slug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS },
  ];

  public supports(region: HistoricalRegion): boolean {
    return (
      region === HistoricalRegion.WORLD ||
      region === HistoricalRegion.ASIA ||
      region === HistoricalRegion.EUROPE_MEDITERRANEAN ||
      region === HistoricalRegion.EUROPE_NORTH_AMERICA ||
      region === HistoricalRegion.SOUTHEAST_ASIA
    );
  }

  public resolveSlug(year: number): string {
    for (const rule of this.rules) {
      if (year <= rule.maxYear) {
        return rule.slug;
      }
    }
    return PERIOD_SLUGS.WORLD_COLD_WAR_MULTIPOLAR;
  }
}

/**
 * Registry điều phối các PeriodResolutionStrategy theo khu vực (DIP / OCP)
 */
export class PeriodResolutionStrategyRegistry {
  private static readonly strategies: IPeriodResolutionStrategy[] = [
    new VietnamPeriodResolutionStrategy(),
    new SovietPeriodResolutionStrategy(),
    new WorldPeriodResolutionStrategy(),
  ];

  private static readonly defaultStrategy = new WorldPeriodResolutionStrategy();

  public static resolve(
    year: number | null | undefined,
    region: HistoricalRegion,
  ): string {
    const normalizedYear = year ?? 1900;
    const strategy =
      this.strategies.find((s) => s.supports(region)) ?? this.defaultStrategy;
    return strategy.resolveSlug(normalizedYear);
  }
}
