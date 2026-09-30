import { ContentStatus, LocationType } from '@/constants/enums';

export interface HistoricalLocationItem {
  id: string;
  name: string;
  type: LocationType;
  address?: string;
  latitude?: number;
  longitude?: number;
  historicalSignificance?: string;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}
