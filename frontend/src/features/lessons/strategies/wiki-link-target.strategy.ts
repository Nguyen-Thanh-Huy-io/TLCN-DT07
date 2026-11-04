import { HistoricalEntityApiService } from '@/services/entities/historical-entity.service';
import { HistoricalEventApiService } from '@/services/entities/historical-event.service';
import { ENTITY_TYPE_LABELS } from '@/features/entities/components/entity-editor.constants';

export enum WikiLinkTargetType {
  INTERNAL_ENTITY = 'INTERNAL_ENTITY',
  INTERNAL_EVENT = 'INTERNAL_EVENT',
  EXTERNAL_URL = 'EXTERNAL_URL',
}

export const WIKI_LINK_ROUTES = {
  ENTITY_PREFIX: '/entities/',
  EVENT_PREFIX: '/events/',
  HTTPS_PREFIX: 'https://',
  HTTP_PREFIX: 'http://',
} as const;

export interface IWikiLinkCandidate {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  targetType: WikiLinkTargetType;
}

export interface IWikiLinkTargetStrategy {
  readonly type: WikiLinkTargetType;
  readonly label: string;
  readonly placeholder: string;
  searchCandidates(query: string): Promise<IWikiLinkCandidate[]>;
  resolveHref(rawUrl: string): string;
}

/**
 * Chiến lược 1: Liên kết Thực thể lịch sử nội bộ (Nhân vật, Triều đại, Địa danh, Hiện vật...)
 */
class InternalEntityLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.INTERNAL_ENTITY;
  public readonly label = 'Thực thể';
  public readonly placeholder = 'Tìm nhân vật, triều đại, địa danh...';

  public async searchCandidates(query: string): Promise<IWikiLinkCandidate[]> {
    const res = await HistoricalEntityApiService.getEntities({
      search: query.trim() || undefined,
      limit: 8,
    });
    return (res.items || []).map((item) => {
      const typeLabel = item.type ? ENTITY_TYPE_LABELS[item.type] || 'Thực thể' : 'Thực thể';
      const years =
        item.birthYear || item.deathYear
          ? `${item.birthYear || '?'} – ${item.deathYear || '?'}`
          : item.startYear || item.endYear
          ? `${item.startYear || '?'} – ${item.endYear || '?'}`
          : '';
      return {
        id: item.id,
        title: item.name,
        subtitle: [typeLabel, years, item.tagline].filter(Boolean).join(' · '),
        href: `${WIKI_LINK_ROUTES.ENTITY_PREFIX}${item.id}`,
        targetType: WikiLinkTargetType.INTERNAL_ENTITY,
      };
    });
  }

  public resolveHref(rawUrl: string): string {
    return rawUrl.trim();
  }
}

/**
 * Chiến lược 2: Liên kết Sự kiện lịch sử nội bộ
 */
class InternalEventLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.INTERNAL_EVENT;
  public readonly label = 'Sự kiện';
  public readonly placeholder = 'Tìm sự kiện lịch sử (VD: Bạch Đằng, 1945)...';

  public async searchCandidates(query: string): Promise<IWikiLinkCandidate[]> {
    const res = await HistoricalEventApiService.getEvents({
      search: query.trim() || undefined,
      limit: 8,
    });
    return (res.items || []).map((evt) => ({
      id: evt.id,
      title: evt.title,
      subtitle: [
        evt.startYear ? `Năm ${evt.startYear}` : '',
        evt.historicalLocation?.name || '',
      ]
        .filter(Boolean)
        .join(' · ') || 'Sự kiện lịch sử',
      href: `${WIKI_LINK_ROUTES.EVENT_PREFIX}${evt.id}`,
      targetType: WikiLinkTargetType.INTERNAL_EVENT,
    }));
  }

  public resolveHref(rawUrl: string): string {
    return rawUrl.trim();
  }
}

/**
 * Chiến lược 3: Liên kết Địa chỉ trang web bên ngoài
 */
class ExternalUrlLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.EXTERNAL_URL;
  public readonly label = 'Trang web';
  public readonly placeholder = 'Nhập địa chỉ liên kết (VD: https://vi.wikipedia.org/...)';

  public async searchCandidates(): Promise<IWikiLinkCandidate[]> {
    return [];
  }

  public resolveHref(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith(WIKI_LINK_ROUTES.HTTP_PREFIX) ||
      trimmed.startsWith(WIKI_LINK_ROUTES.HTTPS_PREFIX) ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
    return `${WIKI_LINK_ROUTES.HTTPS_PREFIX}${trimmed}`;
  }
}

export class WikiLinkTargetStrategyFactory {
  private static readonly strategies: Record<WikiLinkTargetType, IWikiLinkTargetStrategy> = {
    [WikiLinkTargetType.INTERNAL_ENTITY]: new InternalEntityLinkStrategy(),
    [WikiLinkTargetType.INTERNAL_EVENT]: new InternalEventLinkStrategy(),
    [WikiLinkTargetType.EXTERNAL_URL]: new ExternalUrlLinkStrategy(),
  };

  public static getStrategy(type: WikiLinkTargetType): IWikiLinkTargetStrategy {
    return (
      this.strategies[type] || this.strategies[WikiLinkTargetType.INTERNAL_ENTITY]
    );
  }

  public static getAllStrategies(): IWikiLinkTargetStrategy[] {
    return [
      this.strategies[WikiLinkTargetType.INTERNAL_ENTITY],
      this.strategies[WikiLinkTargetType.INTERNAL_EVENT],
      this.strategies[WikiLinkTargetType.EXTERNAL_URL],
    ];
  }

  public static detectTargetTypeFromHref(href?: string | null): WikiLinkTargetType {
    if (!href) return WikiLinkTargetType.INTERNAL_ENTITY;
    if (href.startsWith(WIKI_LINK_ROUTES.ENTITY_PREFIX)) {
      return WikiLinkTargetType.INTERNAL_ENTITY;
    }
    if (href.startsWith(WIKI_LINK_ROUTES.EVENT_PREFIX)) {
      return WikiLinkTargetType.INTERNAL_EVENT;
    }
    return WikiLinkTargetType.EXTERNAL_URL;
  }
}
