import { ContentStatus } from '@/constants/enums';

export interface PeriodItem {
  id: string;
  name: string;
  region?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
  displayOrder?: number;
  orderIndex?: number;
  status?: ContentStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
