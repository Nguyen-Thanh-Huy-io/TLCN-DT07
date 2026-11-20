/**
 * Ô số liệu + hồ sơ tóm lược cho bài Sự kiện và bài Di tích / địa danh. Lấy từ liên kết bài ↔ bài
 * (statements) và hồ sơ di tích — không lặp lại ngày / thời kỳ vì phần đầu trang đã hiện.
 */
import { ArticleKindEnum } from '@/constants/enums';
import type { PublicEntityDetailDto, PublicEntityStatementDto } from '@/services/entities/landing.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import type { EntityQuickStat, FastFactItem } from './entity-reader-adapter';

const linkedOfKind = (entity: PublicEntityDetailDto, kind: ArticleKindEnum): PublicEntityStatementDto[] =>
  entity.statements.filter((stmt) => stmt.relatedEntityType === kind && stmt.relatedEntityName);

/** "Trần Hưng Đạo (chỉ huy)"; liên kết chưa ghi nhãn thì chỉ tên. */
const nameWithRole = (stmt: PublicEntityStatementDto): string =>
  stmt.roleLabel ? `${stmt.relatedEntityName} (${stmt.roleLabel})` : `${stmt.relatedEntityName}`;
const nameOnly = (stmt: PublicEntityStatementDto): string => `${stmt.relatedEntityName}`;

const joinNames = (items: PublicEntityStatementDto[]): string => items.map(nameOnly).join(', ');

/** 1 bài liên kết → có đường dẫn; nhiều bài → liệt kê tên. */
function linkedFact(
  id: string,
  label: string,
  items: PublicEntityStatementDto[],
  nameOf: (stmt: PublicEntityStatementDto) => string,
): FastFactItem[] {
  if (items.length === 0) return [];
  const only = items.length === 1 ? items[0] : null;
  return [
    {
      id,
      label,
      value: items.map(nameOf).join(', '),
      href: only?.relatedEntitySlug ? PUBLIC_ROUTES.ARTICLE(only.relatedEntitySlug) : undefined,
    },
  ];
}

function countStat(id: string, count: number, unit: string, label: string): EntityQuickStat[] {
  return count > 0 ? [{ id, value: `${count} ${unit}`, label }] : [];
}

export function eventQuickStats(entity: PublicEntityDetailDto): EntityQuickStat[] {
  const places = linkedOfKind(entity, ArticleKindEnum.LOCATION);
  const duration =
    entity.startYear != null && entity.endYear != null ? Math.abs(entity.endYear - entity.startYear) : 0;
  return [
    // Nhãn liên kết là chữ tự do ("Diễn ra tại", "Căn cứ tập kết"…) nên ô số liệu dùng tên chung.
    ...(places.length > 0 ? [{ id: 'stat-place', value: joinNames(places), label: 'Địa danh liên quan' }] : []),
    ...countStat('stat-people', linkedOfKind(entity, ArticleKindEnum.PERSON).length, 'nhân vật', 'Nhân vật liên quan'),
    ...countStat('stat-events', linkedOfKind(entity, ArticleKindEnum.EVENT).length, 'sự kiện', 'Sự kiện liên quan'),
    ...countStat('stat-duration', duration, 'năm', 'Kéo dài'),
  ];
}

export function eventFacts(entity: PublicEntityDetailDto): FastFactItem[] {
  return [
    ...linkedFact('event-places', 'Địa danh', linkedOfKind(entity, ArticleKindEnum.LOCATION), nameWithRole),
    ...linkedFact('event-people', 'Nhân vật', linkedOfKind(entity, ArticleKindEnum.PERSON), nameWithRole),
  ];
}

export function locationQuickStats(entity: PublicEntityDetailDto, knownDateLabel: string | null): EntityQuickStat[] {
  return [
    ...(entity.siteTypeLabel ? [{ id: 'stat-site-type', value: entity.siteTypeLabel, label: 'Loại di tích' }] : []),
    ...countStat('stat-events', linkedOfKind(entity, ArticleKindEnum.EVENT).length, 'sự kiện', 'Gắn với nơi này'),
    ...countStat('stat-people', linkedOfKind(entity, ArticleKindEnum.PERSON).length, 'nhân vật', 'Nhân vật liên quan'),
    ...(knownDateLabel ? [{ id: 'stat-founded', value: knownDateLabel, label: 'Niên đại khởi dựng' }] : []),
  ];
}

export function locationFacts(entity: PublicEntityDetailDto): FastFactItem[] {
  const facts: FastFactItem[] = [];
  if (entity.address) facts.push({ id: 'site-address', label: 'Địa chỉ', value: entity.address });
  if (entity.statusNote) facts.push({ id: 'site-status', label: 'Hiện trạng', value: entity.statusNote });
  if (entity.managingAgency) facts.push({ id: 'site-managing-agency', label: 'Đơn vị quản lý', value: entity.managingAgency });
  facts.push(...linkedFact('site-events', 'Sự kiện gắn liền', linkedOfKind(entity, ArticleKindEnum.EVENT), nameOnly));
  return facts;
}
