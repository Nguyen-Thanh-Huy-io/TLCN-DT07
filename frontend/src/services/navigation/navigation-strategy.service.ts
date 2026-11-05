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
} from '../../constants';

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
 * Strategy 1: Dashboard & Analytics (Tổng quan & Báo cáo)
 */
export class DashboardNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.DASHBOARD;
  readonly title = NAV_GROUP_TITLES[NavGroupId.DASHBOARD];

  private readonly items: NavItemConfig[] = [
    {
      id: 'nav-dashboard',
      label: NAV_ITEM_LABELS.DASHBOARD,
      icon: IconName.GRID,
      page: NavigationPageKey.DASHBOARD,
      route: APP_ROUTES.DASHBOARD,
      groupId: this.groupId,
      subtitle: 'KPI & tổng quan hoạt động CMS',
    },
    {
      id: 'nav-analytics',
      label: NAV_ITEM_LABELS.ANALYTICS,
      icon: IconName.CHART,
      page: NavigationPageKey.ANALYTICS,
      route: APP_ROUTES.ANALYTICS,
      groupId: this.groupId,
      subtitle: 'Tiến độ học tập & nhật ký tương tác',
    },
  ];

  getItems(): NavItemConfig[] {
    return this.items;
  }

  matchesPage(pageKey: string): boolean {
    return [
      NavigationPageKey.DASHBOARD,
      NavigationPageKey.ANALYTICS,
      NavigationPageKey.CMS,
    ].includes(pageKey as NavigationPageKey);
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    if (pageKey === NavigationPageKey.ANALYTICS) {
      return this.items[1];
    }
    return this.items[0];
  }
}

/**
 * Strategy 2: Learning & Assessments (Quản trị Bài học & Quiz)
 */
export class LearningNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.LEARNING;
  readonly title = NAV_GROUP_TITLES[NavGroupId.LEARNING];

  private readonly items: NavItemConfig[] = [
    {
      id: 'nav-lessons',
      label: NAV_ITEM_LABELS.LESSONS,
      icon: IconName.BOOK,
      page: NavigationPageKey.CURRICULUM,
      route: APP_ROUTES.CURRICULUM,
      groupId: this.groupId,
      subtitle: 'Lộ trình, chủ đề & bài giảng',
    },
    {
      id: 'nav-questions',
      label: NAV_ITEM_LABELS.QUESTIONS,
      icon: IconName.HELP_CIRCLE,
      page: NavigationPageKey.QUESTIONS,
      route: APP_ROUTES.QUESTIONS,
      groupId: this.groupId,
      subtitle: 'Kho câu hỏi trắc nghiệm & tương tác',
    },
    {
      id: 'nav-quizzes',
      label: NAV_ITEM_LABELS.QUIZZES,
      icon: IconName.SPARK,
      page: NavigationPageKey.QUIZZES,
      route: APP_ROUTES.QUIZZES,
      groupId: this.groupId,
      subtitle: 'Đề ôn tập & kiểm tra theo bài',
    },
    {
      id: 'nav-media',
      label: NAV_ITEM_LABELS.MEDIA,
      icon: IconName.IMAGE,
      page: NavigationPageKey.MEDIA,
      route: APP_ROUTES.MEDIA,
      groupId: this.groupId,
      subtitle: 'Kho tư liệu ảnh, video & văn bản',
    },
  ];

  getItems(): NavItemConfig[] {
    return this.items;
  }

  matchesPage(pageKey: string): boolean {
    return [
      NavigationPageKey.CURRICULUM,
      NavigationPageKey.TOPICS,
      NavigationPageKey.LESSONS,
      NavigationPageKey.QUESTIONS,
      NavigationPageKey.QUIZZES,
      NavigationPageKey.MEDIA,
    ].includes(pageKey as NavigationPageKey);
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    switch (pageKey) {
      case NavigationPageKey.QUESTIONS:
        return this.items[1];
      case NavigationPageKey.QUIZZES:
        return this.items[2];
      case NavigationPageKey.MEDIA:
        return this.items[3];
      default:
        return this.items[0];
    }
  }
}

/**
 * Strategy 3: Historical Knowledge Data (Kho Dữ liệu Lịch sử)
 */
export class KnowledgeNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.KNOWLEDGE;
  readonly title = NAV_GROUP_TITLES[NavGroupId.KNOWLEDGE];

  private readonly items: NavItemConfig[] = [
    {
      id: 'nav-articles',
      label: NAV_ITEM_LABELS.ARTICLES,
      icon: IconName.FILE,
      page: NavigationPageKey.ARTICLES,
      route: APP_ROUTES.ARTICLES.LIST,
      groupId: this.groupId,
      subtitle: 'Nhân vật, sự kiện, di tích, triều đại…',
    },
    {
      id: 'nav-timelines',
      label: NAV_ITEM_LABELS.TIMELINES,
      icon: IconName.CLOCK,
      page: NavigationPageKey.TIMELINES,
      route: APP_ROUTES.TIMELINES.LIST,
      groupId: this.groupId,
      subtitle: 'Các mốc theo trình tự, trỏ tới bài viết',
    },
    {
      id: 'nav-categories',
      label: NAV_ITEM_LABELS.CATEGORIES,
      icon: IconName.FOLDER,
      page: NavigationPageKey.CATEGORIES,
      route: APP_ROUTES.CATEGORIES,
      groupId: this.groupId,
      subtitle: 'Bài viết thuộc loại gì',
    },
    {
      id: 'nav-tags',
      label: NAV_ITEM_LABELS.TAGS,
      icon: IconName.TAG,
      page: NavigationPageKey.TAGS,
      route: APP_ROUTES.TAGS.LIST,
      groupId: this.groupId,
      subtitle: 'Gom bài viết & bài học theo chủ đề',
    },
  ];

  getItems(): NavItemConfig[] {
    return this.items;
  }

  matchesPage(pageKey: string): boolean {
    return this.items.some((item) => item.page === pageKey);
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    return this.items.find((item) => item.page === pageKey) ?? this.items[0];
  }
}

/**
 * Strategy 4: System Administration & Governance (Hệ thống & Phân quyền)
 */
export class SystemNavStrategy implements INavigationGroupStrategy {
  readonly groupId = NavGroupId.SYSTEM;
  readonly title = NAV_GROUP_TITLES[NavGroupId.SYSTEM];

  private readonly items: NavItemConfig[] = [
    {
      id: 'nav-users',
      label: NAV_ITEM_LABELS.USERS,
      icon: IconName.SHIELD,
      page: NavigationPageKey.USERS,
      route: APP_ROUTES.USERS,
      groupId: this.groupId,
      subtitle: 'Tài khoản, vai trò & bảo mật',
    },
    {
      id: 'nav-settings',
      label: NAV_ITEM_LABELS.SETTINGS,
      icon: IconName.SETTINGS,
      page: NavigationPageKey.SETTINGS,
      route: APP_ROUTES.SETTINGS,
      groupId: this.groupId,
      subtitle: 'Danh mục taxonomy & tham số hệ thống',
    },
    {
      id: 'nav-review',
      label: NAV_ITEM_LABELS.REVIEW,
      icon: IconName.CHECK,
      page: NavigationPageKey.REVIEW,
      route: APP_ROUTES.REVIEW,
      groupId: this.groupId,
      subtitle: 'Kiểm duyệt chất lượng nội dung',
    },
  ];

  getItems(): NavItemConfig[] {
    return this.items;
  }

  matchesPage(pageKey: string): boolean {
    return [
      NavigationPageKey.USERS,
      NavigationPageKey.SETTINGS,
      NavigationPageKey.REVIEW,
    ].includes(pageKey as NavigationPageKey);
  }

  getItemByPage(pageKey: string): NavItemConfig | undefined {
    switch (pageKey) {
      case NavigationPageKey.USERS:
        return this.items[0];
      case NavigationPageKey.SETTINGS:
        return this.items[1];
      case NavigationPageKey.REVIEW:
        return this.items[2];
      default:
        return this.items[0];
    }
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
      new LearningNavStrategy(),
      new KnowledgeNavStrategy(),
      new SystemNavStrategy(),
    ];
  }

  public static getInstance(): NavigationFacade {
    if (!NavigationFacade.instance) {
      NavigationFacade.instance = new NavigationFacade();
    }
    return NavigationFacade.instance;
  }

  /**
   * Get all navigation groups with their respective items
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
    switch (pageKey) {
      case NavigationPageKey.CMS:
      case NavigationPageKey.DASHBOARD:
        return NavigationPageKey.DASHBOARD;
      case NavigationPageKey.ANALYTICS:
        return NavigationPageKey.ANALYTICS;
      case NavigationPageKey.CURRICULUM:
      case NavigationPageKey.TOPICS:
      case NavigationPageKey.LESSONS:
        return NavigationPageKey.CURRICULUM;
      case NavigationPageKey.QUESTIONS:
        return NavigationPageKey.QUESTIONS;
      case NavigationPageKey.QUIZZES:
        return NavigationPageKey.QUIZZES;
      case NavigationPageKey.MEDIA:
        return NavigationPageKey.MEDIA;
      case NavigationPageKey.ARTICLES:
        return NavigationPageKey.ARTICLES;
      case NavigationPageKey.TIMELINES:
        return NavigationPageKey.TIMELINES;
      case NavigationPageKey.CATEGORIES:
        return NavigationPageKey.CATEGORIES;
      case NavigationPageKey.TAGS:
        return NavigationPageKey.TAGS;
      case NavigationPageKey.USERS:
        return NavigationPageKey.USERS;
      case NavigationPageKey.SETTINGS:
        return NavigationPageKey.SETTINGS;
      case NavigationPageKey.REVIEW:
        return NavigationPageKey.REVIEW;
      default:
        return NavigationPageKey.DASHBOARD;
    }
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

    const groupTitle = matchingStrategy ? matchingStrategy.title : 'HISGO CMS';
    const item = matchingStrategy?.getItemByPage(pageKey);
    const meta = PAGE_META[pageKey as NavigationPageKey];

    const pageTitle = item?.label ?? meta?.title ?? 'Quản lý';
    const pageSubtitle = item?.subtitle ?? meta?.subtitle ?? '';

    return {
      groupTitle,
      parentLabel: undefined,
      parentRoute: undefined,
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
