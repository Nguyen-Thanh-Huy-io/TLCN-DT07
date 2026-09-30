import { ContentStatus, EntityType } from '@/constants/enums';

export interface HistoricalEntityItem {
  id: string;
  name: string;
  type: EntityType;
  biography?: string;
  birthYear?: number;
  deathYear?: number;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}
