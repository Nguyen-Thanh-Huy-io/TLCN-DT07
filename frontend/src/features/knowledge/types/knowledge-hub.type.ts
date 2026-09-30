import { IconName } from '@/constants/icons';

/**
 * Knowledge Base Tab Keys (No magic strings)
 */
export enum KnowledgeTabKey {
  LOCATIONS = 'locations',
  ENTITIES = 'entities',
  EVENTS = 'events',
  TAGS = 'tags',
}

export interface KnowledgeTabConfig {
  key: KnowledgeTabKey;
  label: string;
  icon: IconName;
  badgeLabel?: string;
  description: string;
}
