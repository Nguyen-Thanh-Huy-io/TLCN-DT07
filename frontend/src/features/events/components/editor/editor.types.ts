import type {
  ContentStatus,
  EventRelationType,
  VerificationStatus,
  LearningPathType,
} from '@/constants/enums';
import type { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import type { ContentRevisionItem } from '@/services/entities/content-revision.service';
import type { EventEntityRoleValue } from '../EventEntityRoles';
import type { LessonMediaItem } from '@/features/lessons/types/editor.types';
import type { TimelineMode, FlexibleDateParseResult } from '@/utils/history-year.utils';

export interface PeriodOption {
  id: string;
  name: string;
  startYear?: number;
  endYear?: number;
  displayOrder?: number;
}

export interface TopicOption {
  id: string;
  name: string;
  periodId?: string | null;
  parentId?: string | null;
  pathType?: LearningPathType | string;
  eyebrow?: string | null;
  displayOrder?: number;
}

export interface LocationOption {
  id: string;
  name: string;
  address?: string | null;
}

export interface OtherEventOption {
  id: string;
  title: string;
  startYear?: number;
  eventDateNote?: string | null;
}

export interface EntityOption {
  id: string;
  name: string;
  type?: string;
  tagline?: string | null;
}

export interface EventCausalRelationItem {
  id?: string;
  targetEventId: string;
  relationType: string;
  description?: string;
  status?: VerificationStatus;
  sourceReference?: string;
  targetEvent?: OtherEventOption | any;
}

export interface IncomingEventRelationItem {
  id: string;
  sourceEventId: string;
  relationType: string;
  description?: string;
  sourceEvent?: OtherEventOption | any;
}
