import { ArticleApiService } from '@/services/entities/article.service';
import { TimelineApiService } from '@/services/entities/timeline.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { dateLabelOf } from '@/utils/year-label';

/**
 * Đích của liên kết wiki trong nội dung khối. Mã giữ tên cũ (INTERNAL_ENTITY / INTERNAL_EVENT)
 * để không phải đổi dữ liệu đã lưu, nhưng nay trỏ tới BÀI VIẾT và DÒNG THỜI GIAN công khai.
 */
export enum WikiLinkTargetType {
  INTERNAL_ENTITY = 'INTERNAL_ENTITY',
  INTERNAL_EVENT = 'INTERNAL_EVENT',
  EXTERNAL_URL = 'EXTERNAL_URL',
}

export const WIKI_LINK_ROUTES = {
  ARTICLE_PREFIX: '/bai-viet/',
  TIMELINE_PREFIX: '/giai-doan/',
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

/** Chiến lược 1: liên kết tới một bài viết (nhân vật, sự kiện, di tích...). */
class InternalArticleLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.INTERNAL_ENTITY;
  public readonly label = 'Bài viết';
  public readonly placeholder = 'Tìm bài viết: nhân vật, sự kiện, di tích...';

  public async searchCandidates(query: string): Promise<IWikiLinkCandidate[]> {
    const res = await ArticleApiService.list({ search: query.trim() || undefined, limit: 8, sort: 'title' });
    return res.items.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: [item.category?.name, dateLabelOf(item)].filter(Boolean).join(' · ') || 'Bài viết',
      href: PUBLIC_ROUTES.ARTICLE(item.slug),
      targetType: WikiLinkTargetType.INTERNAL_ENTITY,
    }));
  }

  public resolveHref(rawUrl: string): string {
    return rawUrl.trim();
  }
}

/** Chiến lược 2: liên kết tới một dòng thời gian. */
class InternalTimelineLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.INTERNAL_EVENT;
  public readonly label = 'Dòng thời gian';
  public readonly placeholder = 'Tìm dòng thời gian (VD: Nhà Trần)...';

  public async searchCandidates(query: string): Promise<IWikiLinkCandidate[]> {
    const res = await TimelineApiService.list({ search: query.trim() || undefined, limit: 8 });
    return res.items.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `${t._count?.nodes ?? 0} mốc`,
      href: PUBLIC_ROUTES.TIMELINE(t.slug),
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
    [WikiLinkTargetType.INTERNAL_ENTITY]: new InternalArticleLinkStrategy(),
    [WikiLinkTargetType.INTERNAL_EVENT]: new InternalTimelineLinkStrategy(),
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
    if (href.startsWith(WIKI_LINK_ROUTES.ARTICLE_PREFIX)) {
      return WikiLinkTargetType.INTERNAL_ENTITY;
    }
    if (href.startsWith(WIKI_LINK_ROUTES.TIMELINE_PREFIX)) {
      return WikiLinkTargetType.INTERNAL_EVENT;
    }
    return WikiLinkTargetType.EXTERNAL_URL;
  }
}
