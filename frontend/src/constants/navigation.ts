import { IconName } from './icons';
import { APP_ROUTES, NavigationPageKey } from './routes';

/**
 * Navigation Group Identifiers (No magic strings)
 */
export enum NavGroupId {
  DASHBOARD = 'DASHBOARD',
  CURRICULUM = 'CURRICULUM',
  KNOWLEDGE = 'KNOWLEDGE',
  OPERATIONS = 'OPERATIONS',
}

/**
 * Display names for navigation groups
 */
export const NAV_GROUP_TITLES: Record<NavGroupId, string> = {
  [NavGroupId.DASHBOARD]: 'TỔNG QUAN',
  [NavGroupId.CURRICULUM]: 'CHƯƠNG TRÌNH HỌC',
  [NavGroupId.KNOWLEDGE]: 'TỪ ĐIỂN TRI THỨC',
  [NavGroupId.OPERATIONS]: 'KIỂM DUYỆT & VẬN HÀNH',
};

/**
 * Navigation item specification
 */
export interface NavItemConfig {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly page: NavigationPageKey;
  readonly route: string;
  readonly groupId: NavGroupId;
  readonly hierarchyTag?: string; // e.g. "Cấp 1", "Cấp 2", "Cấp 3"
  readonly badgeCount?: number;   // e.g. 8 pending items
  readonly subtitle?: string;
}

/**
 * Navigation group specification
 */
export interface NavGroupConfig {
  readonly id: NavGroupId;
  readonly label: string;
  readonly items: NavItemConfig[];
  readonly description?: string;
}
