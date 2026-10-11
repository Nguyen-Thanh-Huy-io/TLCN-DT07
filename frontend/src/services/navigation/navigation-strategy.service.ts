import {
  NavGroupId,
  NAV_GROUP_TITLES,
  NAV_ITEM_LABELS,
  NavItemConfig,
  NavGroupConfig,
  IconName,
  APP_ROUTES,
  PAGE_META,
  NavigationPageKey,
} from '@/constants';

/**
 * Strategy Interface for Navigation Groups (Open-Closed Principle)
 */
export interface INavigationGroupStrategy {
  readonly groupId: NavGroupId;
  readonly title: string;
  getItems(): NavItemConfig[];
  matchesPage(pageKey: string): boolean;
  getItemByPage(pageKey: string): NavItemConfig | undefined;
}

/**
 * Strategy 1: Dashboard / Overview
 */
export class DashboardNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.DASHBOARD;
  readonly title = NAV_GROUP_TITLES[NavGroupId.DASHBOARD];

  getItems(): NavItemConfig[] {
    return [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        icon: IconName.GRID,
        page: 'dashboard',
        route: APP_ROUTES.DASHBOARD,
        groupId: this.groupId,
        subtitle: 'Thống kê & KPI',
      },
    ];
  }

  matchesPage(pageKey: string): boolean {
    return pageKey === 'dashboard' || pageKey === '';
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    return this.matchesPage(pageKey) ? this.getItems()[0] : undefined;
  }
}

/**
 * Strategy 2: Curriculum / Trục xương sống học tập (Giai đoạn -> Chủ đề -> Bài học)
 */
export class CurriculumNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.CURRICULUM;
  readonly title = NAV_GROUP_TITLES[NavGroupId.CURRICULUM];

  private readonly primaryItem: NavItemConfig = {
    id: 'nav-curriculum',
    label: NAV_ITEM_LABELS.CURRICULUM,
    icon: IconName.GRID,
    page: 'curriculum',
    route: APP_ROUTES.CURRICULUM,
    groupId: this.groupId,
    subtitle: 'Chủ đề ➔ Bài học & Quiz',
  };

  private readonly subPageConfigs: Record<string, NavItemConfig> = {
    curriculum: {
      id: 'nav-curriculum',
      label: NAV_ITEM_LABELS.CURRICULUM,
      icon: IconName.GRID,
      page: 'curriculum',
      route: APP_ROUTES.CURRICULUM,
      groupId: this.groupId,
      subtitle: 'Sơ đồ cây & Danh mục học liệu',
    },
    periods: {
      id: 'nav-periods',
      label: 'Chương trình học',
      icon: IconName.GRID,
      page: 'curriculum',
      route: APP_ROUTES.CURRICULUM,
      groupId: this.groupId,
      subtitle: 'Sơ đồ cây & Danh mục học liệu',
    },
    topics: {
      id: 'nav-topics',
      label: 'Chủ đề học tập',
      icon: IconName.FOLDER,
      page: 'topics',
      route: APP_ROUTES.TOPICS.LIST,
      groupId: this.groupId,
      subtitle: 'Chuyên đề lịch sử',
    },
    lessons: {
      id: 'nav-lessons',
      label: 'Bài học & Quiz',
      icon: IconName.BOOK,
      page: 'lessons',
      route: APP_ROUTES.LESSONS.LIST,
      groupId: this.groupId,
      subtitle: 'Nội dung & Kiểm tra',
    },
  };

  getItems(): NavItemConfig[] {
    // Only return the unified primary workspace item for sidebar to prevent cognitive overload
    return [this.primaryItem];
  }

  matchesPage(pageKey: string): boolean {
    return ['curriculum', 'periods', 'topics', 'lessons'].includes(pageKey);
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    return this.subPageConfigs[pageKey] || (this.matchesPage(pageKey) ? this.primaryItem : undefined);
  }
}

/**
 * Strategy 3: Knowledge Base / Từ điển tri thức vệ tinh (Địa danh, Nhân vật, Sự kiện, Thẻ)
 */
export class KnowledgeBaseNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.KNOWLEDGE;
  readonly title = NAV_GROUP_TITLES[NavGroupId.KNOWLEDGE];

  private readonly primaryItem: NavItemConfig = {
    id: 'nav-knowledge',
    label: NAV_ITEM_LABELS.KNOWLEDGE,
    icon: IconName.BOOK,
    page: 'knowledge',
    route: APP_ROUTES.KNOWLEDGE,
    groupId: this.groupId,
    subtitle: 'Địa danh, Nhân vật, Sự kiện, Thẻ',
  };

  private readonly subPageConfigs: Record<string, NavItemConfig> = {
    knowledge: {
      id: 'nav-knowledge',
      label: NAV_ITEM_LABELS.KNOWLEDGE,
      icon: IconName.BOOK,
      page: 'knowledge',
      route: APP_ROUTES.KNOWLEDGE,
      groupId: this.groupId,
      subtitle: 'Kho tri thức tập trung',
    },
    locations: {
      id: 'nav-locations',
      label: 'Địa danh lịch sử',
      icon: IconName.CALENDAR,
      page: 'locations',
      route: APP_ROUTES.LOCATIONS.LIST,
      groupId: this.groupId,
      subtitle: 'Tọa độ & Di tích',
    },
    entities: {
      id: 'nav-entities',
      label: 'Nhân vật & Triều đại',
      icon: IconName.USERS,
      page: 'entities',
      route: APP_ROUTES.ENTITIES.LIST,
      groupId: this.groupId,
      subtitle: 'Tiểu sử & Dòng họ',
    },
    events: {
      id: 'nav-events',
      label: 'Sự kiện lịch sử',
      icon: IconName.CLOCK,
      page: 'events',
      route: APP_ROUTES.EVENTS.LIST,
      groupId: this.groupId,
      subtitle: 'Dòng thời gian',
    },
    tags: {
      id: 'nav-tags',
      label: 'Thẻ phân loại',
      icon: IconName.TAG,
      page: 'tags',
      route: APP_ROUTES.TAGS.LIST,
      groupId: this.groupId,
      subtitle: 'Nhãn phân loại',
    },
  };

  getItems(): NavItemConfig[] {
    // Only return unified primary workspace item for sidebar to prevent cognitive overload
    return [this.primaryItem];
  }

  matchesPage(pageKey: string): boolean {
    return ['knowledge', 'locations', 'entities', 'events', 'tags'].includes(pageKey);
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    return this.subPageConfigs[pageKey] || (this.matchesPage(pageKey) ? this.primaryItem : undefined);
  }
}

/**
 * Strategy 4: Operations / Kiểm duyệt & Vận hành
 */
export class OperationsNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.OPERATIONS;
  readonly title = NAV_GROUP_TITLES[NavGroupId.OPERATIONS];

  getItems(): NavItemConfig[] {
    return [
      {
        id: 'nav-review',
        label: 'Duyệt bài học',
        icon: IconName.CHECK,
        page: 'review',
        route: APP_ROUTES.REVIEW,
        groupId: this.groupId,
        badgeCount: 8,
        subtitle: 'Kiểm duyệt chất lượng',
      },
      {
        id: 'nav-users',
        label: 'Người dùng & Quyền',
        icon: IconName.USERS,
        page: 'users',
        route: APP_ROUTES.USERS,
        groupId: this.groupId,
        subtitle: 'Tài khoản & Phân quyền',
      },
    ];
  }

  matchesPage(pageKey: string): boolean {
    return ['review', 'users'].includes(pageKey);
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    return this.getItems().find((item) => item.page === pageKey);
  }
}

/**
 * Navigation Facade (Facade Pattern): Provides unified navigation management
 */
export class NavigationFacade {
  private static instance: NavigationFacade;
  private readonly strategies: INavigationGroupStrategy[];

  private constructor() {
    this.strategies = [
      new DashboardNavStrategy(),
      new CurriculumNavStrategy(),
      new KnowledgeBaseNavStrategy(),
      new OperationsNavStrategy(),
    ];
  }

  public static getInstance(): NavigationFacade {
    if (!NavigationFacade.instance) {
      NavigationFacade.instance = new NavigationFacade();
    }
    return NavigationFacade.instance;
  }

  /**
   * Get all navigation groups with their respective items (Clean 5 items total)
   */
  public getNavGroups(): NavGroupConfig[] {
    return this.strategies.map((strategy) => ({
      id: strategy.groupId,
      label: strategy.title,
      items: strategy.getItems(),
    }));
  }

  /**
   * Resolve which primary item on the sidebar should be highlighted active
   */
  public resolveActiveSidebarPage(pageKey: string): NavigationPageKey {
    if (['curriculum', 'periods', 'topics', 'lessons'].includes(pageKey)) {
      return 'curriculum';
    }
    if (['knowledge', 'locations', 'entities', 'events', 'tags'].includes(pageKey)) {
      return 'knowledge';
    }
    if (pageKey === 'review') return 'review';
    if (pageKey === 'users') return 'users';
    return 'dashboard';
  }

  /**
   * Resolve breadcrumb details based on active page
   */
  public resolveBreadcrumb(pageKey: string): {
    groupTitle: string;
    parentLabel?: string;
    parentRoute?: string;
    pageTitle: string;
    pageSubtitle: string;
    hierarchyTag?: string;
  } {
    const matchingStrategy = this.strategies.find((strat) =>
      strat.matchesPage(pageKey),
    );

    const groupTitle = matchingStrategy
      ? matchingStrategy.title
      : 'HISGO CMS';

    const item = matchingStrategy?.getItemByPage(pageKey);
    const meta = PAGE_META[pageKey as NavigationPageKey];

    const pageTitle = item?.label ?? meta?.title ?? 'Quản lý';
    const pageSubtitle = item?.subtitle ?? meta?.subtitle ?? '';

    // Handle hierarchy breadcrumbs
    let parentLabel: string | undefined;
    let parentRoute: string | undefined;
    if (['periods', 'topics', 'lessons'].includes(pageKey)) {
      parentLabel = 'Chương trình học';
      parentRoute = APP_ROUTES.CURRICULUM;
    } else if (['locations', 'entities', 'events', 'tags'].includes(pageKey)) {
      parentLabel = 'Từ điển tri thức';
      parentRoute = APP_ROUTES.KNOWLEDGE;
    }

    return {
      groupTitle,
      parentLabel,
      parentRoute,
      pageTitle,
      pageSubtitle,
      hierarchyTag: item?.hierarchyTag,
    };
  }

  /**
   * Find item config by page key
   */
  public getItem(pageKey: string): NavItemConfig | undefined {
    for (const strategy of this.strategies) {
      const found = strategy.getItemByPage(pageKey);
      if (found) return found;
    }
    return undefined;
  }
}

/**
 * Export default singleton instance
 */
export const navigationFacade = NavigationFacade.getInstance();
