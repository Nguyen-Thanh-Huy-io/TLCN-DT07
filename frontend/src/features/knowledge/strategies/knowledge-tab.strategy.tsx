import React from 'react';
import { KnowledgeTabKey, KnowledgeTabConfig } from '../types/knowledge-hub.type';
import { IconName } from '@/constants/icons';
import { LocationList } from '@/features/locations/components/LocationList';
import { EntityList } from '@/features/entities/components/EntityList';
import { EventList } from '@/features/events/components/EventList';
import { TagList } from '@/features/tags/components/TagList';

/**
 * Strategy interface for rendering Knowledge Base tabs (Open-Closed Principle)
 */
export interface IKnowledgeTabStrategy {
  readonly config: KnowledgeTabConfig;
  renderComponent(): React.ReactNode;
}

export class LocationsTabStrategy implements IKnowledgeTabStrategy {
  readonly config: KnowledgeTabConfig = {
    key: KnowledgeTabKey.LOCATIONS,
    label: 'Địa danh & Di tích',
    icon: IconName.CALENDAR,
    badgeLabel: 'Không gian',
    description: 'Bản đồ di tích, kinh đô, thành lũy và chiến trường lịch sử',
  };

  renderComponent(): React.ReactNode {
    return <LocationList />;
  }
}

export class EntitiesTabStrategy implements IKnowledgeTabStrategy {
  readonly config: KnowledgeTabConfig = {
    key: KnowledgeTabKey.ENTITIES,
    label: 'Nhân vật & Triều đại',
    icon: IconName.USERS,
    badgeLabel: 'Chủ thể',
    description: 'Hồ sơ danh nhân, tướng lĩnh, triều đại phong kiến và tổ chức',
  };

  renderComponent(): React.ReactNode {
    return <EntityList />;
  }
}

export class EventsTabStrategy implements IKnowledgeTabStrategy {
  readonly config: KnowledgeTabConfig = {
    key: KnowledgeTabKey.EVENTS,
    label: 'Dòng sự kiện lịch sử',
    icon: IconName.CLOCK,
    badgeLabel: 'Thời gian',
    description: 'Biên niên sự kiện, các trận đánh và hiệp định quan trọng',
  };

  renderComponent(): React.ReactNode {
    return <EventList />;
  }
}

export class TagsTabStrategy implements IKnowledgeTabStrategy {
  readonly config: KnowledgeTabConfig = {
    key: KnowledgeTabKey.TAGS,
    label: 'Thẻ phân loại',
    icon: IconName.TAG,
    badgeLabel: 'Phân loại',
    description: 'Nhãn danh mục dùng để liên kết nội dung học tập đa chiều',
  };

  renderComponent(): React.ReactNode {
    return <TagList />;
  }
}

/**
 * Factory for resolving Knowledge Tab Strategies (Factory Pattern)
 */
export class KnowledgeTabStrategyFactory {
  private static strategies: Record<KnowledgeTabKey, IKnowledgeTabStrategy> = {
    [KnowledgeTabKey.LOCATIONS]: new LocationsTabStrategy(),
    [KnowledgeTabKey.ENTITIES]: new EntitiesTabStrategy(),
    [KnowledgeTabKey.EVENTS]: new EventsTabStrategy(),
    [KnowledgeTabKey.TAGS]: new TagsTabStrategy(),
  };

  public static getStrategy(key: KnowledgeTabKey): IKnowledgeTabStrategy {
    return this.strategies[key] || this.strategies[KnowledgeTabKey.LOCATIONS];
  }

  public static getAllStrategies(): IKnowledgeTabStrategy[] {
    return Object.values(this.strategies);
  }
}
