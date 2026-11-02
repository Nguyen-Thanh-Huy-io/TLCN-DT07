export enum TimelineItemType {
  BIRTH = 'BIRTH',
  DEATH = 'DEATH',
  FOUNDING = 'FOUNDING',
  DISSOLUTION = 'DISSOLUTION',
  EVENT_PARTICIPATION = 'EVENT_PARTICIPATION',
  STATEMENT = 'STATEMENT',
}

export const TIMELINE_ITEM_TYPE = TimelineItemType;

export enum TimelineDirection {
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

export const TIMELINE_DIRECTION = TimelineDirection;

export enum TimelineSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export const TIMELINE_SORT_ORDER = TimelineSortOrder;

export const TIMELINE_ITEM_ORDER_WEIGHT: Readonly<Record<TimelineItemType, number>> = {
  [TimelineItemType.BIRTH]: 1,
  [TimelineItemType.FOUNDING]: 1,
  [TimelineItemType.EVENT_PARTICIPATION]: 2,
  [TimelineItemType.STATEMENT]: 3,
  [TimelineItemType.DISSOLUTION]: 4,
  [TimelineItemType.DEATH]: 5,
};

export const TIMELINE_DEFAULT_TITLES = {
  BIRTH: 'Sinh ra',
  DEATH: 'Qua đời',
  FOUNDING: 'Thành lập / Khởi lập',
  DISSOLUTION: 'Kết thúc / Suy tàn',
} as const;
