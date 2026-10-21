import { ContentStatus } from '@/constants/enums';

export interface PeriodItem {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    startYear?: number | null;
    endYear?: number | null;
  } | null;
  children?: Array<{
    id: string;
    name: string;
    startYear?: number | null;
    endYear?: number | null;
    timeLabel?: string | null;
    status?: ContentStatus;
    displayOrder?: number;
  }>;
  topics?: Array<{
    id: string;
    name: string;
    eyebrow?: string | null;
    status?: ContentStatus;
    displayOrder?: number;
    isFeatured?: boolean;
  }>;
  _count?: {
    topics?: number;
    historicalEvents?: number;
    historicalEntities?: number;
    children?: number;
  };
  region?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  timeLabel?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  displayOrder?: number;
  orderIndex?: number;
  status?: ContentStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
