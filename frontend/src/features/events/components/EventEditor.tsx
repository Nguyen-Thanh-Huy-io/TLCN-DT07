'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  EntityDetailLayout,
  DataCompletenessItem,
  FormSectionConfig,
} from '@/components/common/EntityDetailLayout';
import { HistoricalDateRangeField } from '@/components/common/HistoricalDateRangeField';
import { TipTapContent } from '@/features/lessons/components/TipTapContent';
import {
  KnowledgeRelationManager,
  KnowledgeRelationItem,
  KnowledgeRelationType,
} from '@/components/common/KnowledgeRelationManager';
import {
  ParentContextComboboxField,
  ParentContextCategory,
  ParentContextOption,
} from '@/components/common/ParentContextComboboxField';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import { LessonMediaManager } from '@/features/lessons/components/LessonMediaManager';
import { LessonMediaItem } from '@/features/lessons/types/editor.types';
import { IconName } from '@/constants/icons';
import {
  ContentStatus,
  EntityType,
  LearningPathType,
  EventCategory,
  EventRelationType,
  EVENT_RELATION_TYPE_LABELS,
  VerificationStatus,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { TaxonomyApiService, type TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { EventCategoryPanel } from './EventCategoryPanel';
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { EventEntityRoles, emptyEventRole, type EventEntityRoleValue } from './EventEntityRoles';
import { relationLabel, relationOptions } from '@/features/taxonomy/taxonomy-labels';
import {
  HistoricalEventApiService,
  SaveHistoricalEventPayload,
} from '@/services/entities/historical-event.service';
import api, {
  extractErrorMessage,
  parsePaginatedResponse,
} from '@/services/api';
import {
  TimelineMode,
  parseFlexibleHistoricalDate,
  formatRecordToFlexibleDateInput,
  buildSuggestedEventDisplayString,
  formatHistoricalYear,
} from '@/utils/history-year.utils';

export interface EventEditorProps {
  eventId?: string;
}

interface PeriodOption {
  id: string;
  name: string;
  startYear?: number;
  endYear?: number;
  displayOrder?: number;
}

interface TopicOption {
  id: string;
  name: string;
  periodId?: string | null;
  parentId?: string | null;
  pathType?: LearningPathType | string;
  eyebrow?: string | null;
  displayOrder?: number;
}

interface LocationOption {
  id: string;
  name: string;
  address?: string | null;
}

interface OtherEventOption {
  id: string;
  title: string;
  startYear?: number;
  eventDateNote?: string | null;
}

interface EntityOption {
  id: string;
  name: string;
  type?: string;
  tagline?: string | null;
}

function isPersonEntityType(type?: string | null): boolean {
  return (
    type === EntityType.PERSON ||
    type === 'FIGURE' ||
    type === 'HISTORICAL_FIGURE' ||
    (!isForceEntityType(type) && !isArtifactEntityType(type))
  );
}

function isForceEntityType(type?: string | null): boolean {
  return (
    type === EntityType.MILITARY_FORCE ||
    type === EntityType.ORGANIZATION ||
    type === EntityType.DYNASTY
  );
}

function isArtifactEntityType(type?: string | null): boolean {
  return type === EntityType.ARTIFACT || type === EntityType.OTHER;
}

function generateSlugPreview(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function EventEditor({ eventId }: EventEditorProps) {
  const router = useRouter();
  const isEditMode = Boolean(eventId);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingAction, setSavingAction] = useState<'DRAFT' | 'PUBLISH' | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Dữ liệu tham chiếu (Knowledge Graph Options)
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [otherEvents, setOtherEvents] = useState<OtherEventOption[]>([]);

  // Mục 1. Thông tin cơ bản & Phân cấp cây sự kiện
  const [title, setTitle] = useState('');
  // Loại sự kiện theo "Danh mục dùng chung" (cây, nhiều loại; phần tử đầu là loại chính).
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categoryGroup, setCategoryGroup] = useState<TaxonomyGroupItem>();
  // Phiên bản hóa: bản sửa chờ duyệt đang mở (form hiện bản sửa) và thông báo sau khi lưu.
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  // Vai trò từng thực thể đã gắn (mã theo nhóm EVENT_ROLE + mô tả tự do).
  const [roleGroup, setRoleGroup] = useState<TaxonomyGroupItem>();
  const [relationGroup, setRelationGroup] = useState<TaxonomyGroupItem>();
  const [entityRoles, setEntityRoles] = useState<Record<string, EventEntityRoleValue>>({});
  /** Mã enum cũ của bản ghi chưa có categoryIds — quy đổi khi danh mục tải xong. */
  const [legacyCategory, setLegacyCategory] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isCustomSlugMode, setIsCustomSlugMode] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [parentId, setParentId] = useState<string>('');
  const [isSubEvent, setIsSubEvent] = useState<boolean>(false);

  // Mục 2. Thời gian & địa điểm (3 cụm điều khiển tinh gọn: Segmented Control + 1 ô nhập linh hoạt + Thời gian hiển thị tự động)
  const [timelineMode, setTimelineMode] = useState<TimelineMode>(
    TimelineMode.RANGE,
  );
  const [startDateInput, setStartDateInput] = useState<string>('19/05/1959');
  const [startIsBce, setStartIsBce] = useState<boolean>(false);

  const [endDateInput, setEndDateInput] = useState<string>('30/04/1975');
  const [endIsBce, setEndIsBce] = useState<boolean>(false);

  const [eventDateNote, setEventDateNote] = useState('');
  const [isCustomDisplayMode, setIsCustomDisplayMode] = useState(false);

  const [locationId, setLocationId] = useState('');
  const [locationLabel, setLocationLabel] = useState('');

  // Mục 4. Mối liên hệ & Đồ thị nhân quả (Causal Graph & Knowledge Relations)
  const [periodId, setPeriodId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  // Danh sách quan hệ nhân quả giữa các sự kiện (HistoricalEventRelation N-N)
  const [eventRelations, setEventRelations] = useState<
    Array<{
      id?: string;
      targetEventId: string;
      relationType: string;
      description?: string;
      status?: VerificationStatus;
      sourceReference?: string;
      targetEvent?: any;
    }>
  >([]);
  const [incomingEventRelations, setIncomingEventRelations] = useState<any[]>([]);

  // State cho Form tạo quan hệ sự kiện mới (Grid chuẩn: 50%-50% / 25%-25%-50%)
  const [newTargetEventId, setNewTargetEventId] = useState('');
  const [newEventRelationType, setNewEventRelationType] = useState<string>(
    EventRelationType.CAUSES,
  );
  const [newEventRelationDesc, setNewEventRelationDesc] = useState('');
  const [newEventRelationStatus, setNewEventRelationStatus] = useState<VerificationStatus>(
    VerificationStatus.VERIFIED,
  );
  const [newEventRelationRef, setNewEventRelationRef] = useState('');

  // Mục 5. Tài liệu
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [sourceReferenceNote, setSourceReferenceNote] = useState('');
  const [mediaList, setMediaList] = useState<LessonMediaItem[]>([]);

  const handleAddMedia = (item: LessonMediaItem) => {
    setMediaList((prev) => [...prev, item]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  // Mục 6. Kiểm duyệt & xuất bản
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);
  const [createdAt, setCreatedAt] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);

  const autoSlugPreview = useMemo(() => generateSlugPreview(title), [title]);
  const activeSlug = useMemo(
    () => (isCustomSlugMode ? customSlug : autoSlugPreview),
    [isCustomSlugMode, customSlug, autoSlugPreview],
  );

  const parsedStart = useMemo(
    () => parseFlexibleHistoricalDate(startDateInput, startIsBce),
    [startDateInput, startIsBce],
  );

  const parsedEnd = useMemo(
    () => parseFlexibleHistoricalDate(endDateInput, endIsBce),
    [endDateInput, endIsBce],
  );

  // Tự động ghép chuỗi "Thời gian hiển thị" từ Mốc bắt đầu & Mốc kết thúc
  const autoDisplayText = useMemo(
    () =>
      buildSuggestedEventDisplayString(
        timelineMode,
        {
          day: parsedStart.day,
          month: parsedStart.month,
          year: parsedStart.absYear,
          era: parsedStart.era,
        },
        timelineMode === TimelineMode.RANGE && parsedEnd.valid
          ? {
              day: parsedEnd.day,
              month: parsedEnd.month,
              year: parsedEnd.absYear,
              era: parsedEnd.era,
            }
          : undefined,
      ),
    [timelineMode, parsedStart, parsedEnd],
  );

  useEffect(() => {
    if (!isCustomDisplayMode) {
      setEventDateNote(autoDisplayText);
    }
  }, [autoDisplayText, isCustomDisplayMode]);

  useEffect(() => {
    TaxonomyApiService.getGroups(['EVENT_CATEGORY', 'EVENT_ROLE', 'EVENT_RELATION'])
      .then((groups) => {
        setCategoryGroup(groups.find((g) => g.code === 'EVENT_CATEGORY'));
        setRoleGroup(groups.find((g) => g.code === 'EVENT_ROLE'));
        setRelationGroup(groups.find((g) => g.code === 'EVENT_RELATION'));
      })
      .catch((err) => console.warn('Failed to fetch event taxonomies:', err));
  }, []);

  // Bản ghi cũ chỉ có mã enum: chọn sẵn loại cùng mã (hoặc alias) trong danh mục.
  useEffect(() => {
    if (!legacyCategory || !categoryGroup) return;
    const lower = legacyCategory.toLowerCase();
    const term = categoryGroup.terms.find((t) => t.code === legacyCategory || t.aliases.includes(lower));
    if (term) setCategoryIds((ids) => (ids.length ? ids : [term.id]));
    setLegacyCategory(null);
  }, [legacyCategory, categoryGroup]);

  const loadReferenceDataAndDetail = useCallback(async () => {
    try {
      setLoadingInitial(true);
      const [periodsRes, topicsRes, locationsRes, entitiesRes, eventsRes] =
        await Promise.all([
          api.get('/periods?limit=100'),
          api.get('/topics?limit=100'),
          api.get('/historical-entities?type=LOCATION&limit=100'),
          api.get('/historical-entities?limit=100'),
          api.get('/historical-events?limit=100'),
        ]);

      const periodItems = parsePaginatedResponse<PeriodOption>(
        periodsRes.data,
      ).items;
      const topicItems = parsePaginatedResponse<TopicOption>(
        topicsRes.data,
      ).items;
      const locationItems = parsePaginatedResponse<LocationOption>(
        locationsRes.data,
      ).items;
      const entityItems = parsePaginatedResponse<EntityOption>(
        entitiesRes.data,
      ).items;
      const eventItems = parsePaginatedResponse<OtherEventOption>(
        eventsRes.data,
      ).items.filter((ev) => !eventId || ev.id !== eventId);

      setPeriods(periodItems);
      setTopics(topicItems);
      setLocations(locationItems);
      setEntities(entityItems);
      setOtherEvents(eventItems);

      if (isEditMode && eventId) {
        const fetched = await HistoricalEventApiService.getEventById(eventId);
        // Đang xuất bản mà có bản sửa chờ duyệt → mở bản sửa đó để sửa tiếp không mất phần trước.
        const { detail, pending } = await withPendingDraft('EVENT', eventId, fetched);
        setPendingRevision(pending);
        setTitle(detail.title || '');
        if (detail.slug) {
          setCustomSlug(detail.slug);
          setIsCustomSlugMode(true);
        }

        const startFormatted = formatRecordToFlexibleDateInput(
          detail.startYear,
          detail.startMonth,
          detail.startDay,
        );
        setStartDateInput(startFormatted.text);
        setStartIsBce(startFormatted.isBce);

        if (detail.endYear !== undefined && detail.endYear !== null) {
          setTimelineMode(TimelineMode.RANGE);
          const endFormatted = formatRecordToFlexibleDateInput(
            detail.endYear,
            detail.endMonth,
            detail.endDay,
          );
          setEndDateInput(endFormatted.text);
          setEndIsBce(endFormatted.isBce);
        } else {
          setTimelineMode(TimelineMode.POINT);
          setEndDateInput('');
          setEndIsBce(false);
        }

        if (detail.eventDateNote) {
          setEventDateNote(detail.eventDateNote);
          setIsCustomDisplayMode(true);
        }
        const plainFallbackSummary = (detail.description || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        setSummary(detail.summary || plainFallbackSummary);
        setDescription(detail.description || '');
        setPeriodId(
          detail.periodId || detail.topic?.periodId || periodItems[0]?.id || '',
        );
        setTopicId(detail.topicId || '');
        setLocationId(detail.locationId || '');
        setLocationLabel(
          detail.historicalLocation?.name || (detail.metadata?.rawLocation as string) || '',
        );
        setThumbnailUrl(detail.thumbnailUrl || '');
        setSourceReferenceNote((detail.metadata?.sourceReferenceNote as string) || '');
        if (detail.parentId) {
          setParentId(detail.parentId);
          setIsSubEvent(true);
        } else {
          setParentId('');
          setIsSubEvent(false);
        }
        setStatus(detail.status || ContentStatus.PUBLISHED);
        if (detail.categoryIds?.length) setCategoryIds(detail.categoryIds);
        else setLegacyCategory(detail.category || null);
        setMetadata(
          detail.metadata && typeof detail.metadata === 'object' && !Array.isArray(detail.metadata)
            ? (detail.metadata as Record<string, any>)
            : {},
        );
        setCreatedAt(detail.createdAt || '');
        setUpdatedAt(detail.updatedAt || '');

        if (Array.isArray(detail.entities)) {
          setSelectedEntityIds(
            detail.entities
              .map((item) => item.entityId || item.entity?.id || '')
              .filter(Boolean),
          );
          setEntityRoles(
            Object.fromEntries(
              detail.entities.map((item) => [
                item.entityId,
                {
                  role: item.role || emptyEventRole(item.entity?.type).role,
                  roleLabel: item.roleLabel || '',
                  isPrimary: Boolean(item.isPrimary),
                  notes: item.notes ?? null,
                },
              ]),
            ),
          );
        }

        if (Array.isArray(detail.media)) {
          setMediaList(
            detail.media.map((m) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              caption: m.caption || undefined,
              displayOrder: m.displayOrder ?? 0,
            })),
          );
        }

        const rawDetail = detail as any;
        if (Array.isArray(rawDetail.outgoingRelations)) {
          setEventRelations(
            rawDetail.outgoingRelations.map((r: any) => ({
              id: r.id,
              targetEventId: r.targetEventId,
              relationType: r.relationType as EventRelationType,
              description: r.description || '',
              status: (r.status as VerificationStatus) || VerificationStatus.VERIFIED,
              sourceReference: r.sourceReference || '',
              targetEvent: r.targetEvent,
            })),
          );
        }
        if (Array.isArray(rawDetail.incomingRelations)) {
          setIncomingEventRelations(rawDetail.incomingRelations);
        }
      } else if (periodItems.length > 0) {
        setPeriodId(periodItems[0].id);
      }
    } catch (err) {
      console.error('Failed to load event editor data:', err);
      alert(
        extractErrorMessage(
          err,
          'Không thể tải dữ liệu chi tiết Sự kiện lịch sử.',
        ),
      );
      router.push(APP_ROUTES.EVENTS.LIST);
    } finally {
      setLoadingInitial(false);
    }
  }, [isEditMode, eventId, router]);

  useEffect(() => {
    loadReferenceDataAndDetail();
  }, [loadReferenceDataAndDetail]);

  const handleSelectLocation = (locId: string) => {
    setLocationId(locId);
    if (locId) {
      const found = locations.find((l) => l.id === locId);
      if (found && !locationLabel.trim()) {
        setLocationLabel(found.name);
      }
    }
  };

  const toggleEntitySelection = (id: string) => {
    setSelectedEntityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Hợp nhất toàn bộ kho tri thức để hiển thị trong Modal "Thêm liên kết tri thức" (xyz.png)
  const availableKnowledgeItems: KnowledgeRelationItem[] = useMemo(() => {
    const items: KnowledgeRelationItem[] = [];

    // 1. Sự kiện lịch sử khác (EVENT)
    otherEvents.forEach((ev) => {
      items.push({
        id: `event:${ev.id}`,
        rawId: ev.id,
        name: ev.title,
        type: KnowledgeRelationType.EVENT,
        typeLabel: 'Sự kiện',
        subtitle: ev.eventDateNote || 'Sự kiện lịch sử',
        yearLabel: ev.startYear ? formatHistoricalYear(ev.startYear) : undefined,
      });
    });

    // 2. Thời kỳ lịch sử (PERIOD)
    periods.forEach((p) => {
      const yearLabel =
        p.startYear !== undefined
          ? `${formatHistoricalYear(p.startYear)} – ${
              p.endYear !== undefined && p.endYear !== null
                ? formatHistoricalYear(p.endYear)
                : 'nay'
            }`
          : undefined;
      items.push({
        id: `period:${p.id}`,
        rawId: p.id,
        name: p.name,
        type: KnowledgeRelationType.PERIOD,
        typeLabel: 'Thời kỳ',
        subtitle: 'Thời kỳ lịch sử',
        yearLabel,
      });
    });

    // 3. Chủ đề / Bài học liên kết (TOPIC)
    topics.forEach((t) => {
      items.push({
        id: `topic:${t.id}`,
        rawId: t.id,
        name: t.name,
        type: KnowledgeRelationType.TOPIC,
        typeLabel: 'Chủ đề',
        subtitle: t.eyebrow || 'Chủ đề lịch sử',
      });
    });

    // 4. Địa điểm & Di tích (LOCATION)
    locations.forEach((loc) => {
      items.push({
        id: `location:${loc.id}`,
        rawId: loc.id,
        name: loc.name,
        type: KnowledgeRelationType.LOCATION,
        typeLabel: 'Địa điểm',
        subtitle: loc.address || 'Địa danh lịch sử',
      });
    });

    // 5. Thực thể: Nhân vật (PERSON), Lực lượng (FORCE), Hiện vật (ARTIFACT)
    entities.forEach((ent) => {
      let relType = KnowledgeRelationType.PERSON;
      let typeLabel = 'Nhân vật';
      if (isForceEntityType(ent.type)) {
        relType = KnowledgeRelationType.FORCE;
        typeLabel = 'Lực lượng';
      } else if (isArtifactEntityType(ent.type)) {
        relType = KnowledgeRelationType.ARTIFACT;
        typeLabel = 'Hiện vật';
      }

      items.push({
        id: `entity:${ent.id}`,
        rawId: ent.id,
        name: ent.name,
        type: relType,
        typeLabel,
        subtitle: ent.tagline || (relType === KnowledgeRelationType.PERSON ? 'Nhân vật lịch sử' : undefined),
      });
    });

    return items;
  }, [otherEvents, periods, topics, locations, entities]);

  // Các thực thể đang thực sự liên kết với sự kiện hiện tại (hiển thị trên bảng Mục 4)
  const linkedKnowledgeItems: KnowledgeRelationItem[] = useMemo(() => {
    const list: KnowledgeRelationItem[] = [];

    // Sự kiện cha trực thuộc (parentId)
    if (parentId) {
      const parentEv = otherEvents.find((ev) => ev.id === parentId);
      if (parentEv) {
        list.push({
          id: `event:${parentEv.id}`,
          rawId: parentEv.id,
          name: parentEv.title,
          type: KnowledgeRelationType.EVENT,
          typeLabel: 'Sự kiện cha',
          relationLabel: 'Trực thuộc chiến dịch',
          subtitle: 'Sự kiện / chiến dịch cha trực thuộc',
          yearLabel: parentEv.startYear ? formatHistoricalYear(parentEv.startYear) : undefined,
        });
      }
    }

    // Giai đoạn / Thời kỳ (periodId)
    if (periodId) {
      const found = periods.find((p) => p.id === periodId);
      if (found) {
        list.push({
          id: `period:${found.id}`,
          rawId: found.id,
          name: found.name,
          type: KnowledgeRelationType.PERIOD,
          typeLabel: 'Thời kỳ',
          relationLabel: `Thuộc thời kỳ`,
          subtitle: 'Thời kỳ lịch sử',
          yearLabel:
            found.startYear !== undefined
              ? `${formatHistoricalYear(found.startYear)} – ${
                  found.endYear !== undefined && found.endYear !== null
                    ? formatHistoricalYear(found.endYear)
                    : 'nay'
                }`
              : undefined,
        });
      }
    }

    // Chủ đề liên kết (topicId)
    if (topicId) {
      const found = topics.find((t) => t.id === topicId);
      if (found) {
        list.push({
          id: `topic:${found.id}`,
          rawId: found.id,
          name: found.name,
          type: KnowledgeRelationType.TOPIC,
          typeLabel: 'Chủ đề',
          relationLabel: 'Thuộc chủ đề',
          subtitle: found.eyebrow || 'Chủ đề lịch sử',
        });
      }
    }

    // Địa điểm liên kết (locationId)
    if (locationId) {
      const found = locations.find((l) => l.id === locationId);
      if (found) {
        list.push({
          id: `location:${found.id}`,
          rawId: found.id,
          name: found.name,
          type: KnowledgeRelationType.LOCATION,
          typeLabel: 'Địa điểm',
          relationLabel: 'Địa danh / Di tích diễn ra',
          subtitle: found.address || 'Địa danh lịch sử',
        });
      }
    }

    // Các thực thể đã gắn (Nhân vật, Lực lượng, Hiện vật, hoặc Sự kiện liên quan)
    selectedEntityIds.forEach((eid) => {
      // Tránh lặp nếu eid trùng với parentId đã xử lý ở trên
      if (eid === parentId) return;

      const ent = entities.find((e) => e.id === eid);
      if (ent) {
        let relType = KnowledgeRelationType.PERSON;
        let typeLabel = 'Nhân vật';
        let relationLabel = 'Nhân vật tham gia';

        if (isForceEntityType(ent.type)) {
          relType = KnowledgeRelationType.FORCE;
          typeLabel = 'Lực lượng';
          relationLabel = 'Lực lượng tham gia';
        } else if (isArtifactEntityType(ent.type)) {
          relType = KnowledgeRelationType.ARTIFACT;
          typeLabel = 'Hiện vật';
          relationLabel = 'Vũ khí / Hiện vật';
        }

        list.push({
          id: `entity:${ent.id}`,
          rawId: ent.id,
          name: ent.name,
          type: relType,
          typeLabel,
          relationLabel,
          subtitle: ent.tagline || 'Đã liên kết',
        });
      }
    });

    return list;
  }, [parentId, otherEvents, periodId, topicId, locationId, selectedEntityIds, periods, topics, locations, entities]);

  const handleAddKnowledgeItems = (itemsToAdd: KnowledgeRelationItem[]) => {
    const newEntityIds: string[] = [];

    itemsToAdd.forEach((item) => {
      if (item.type === KnowledgeRelationType.EVENT) {
        // Gán sự kiện cha trực thuộc
        setParentId(item.rawId);
        setIsSubEvent(true);
      } else if (item.type === KnowledgeRelationType.PERIOD) {
        setPeriodId(item.rawId);
      } else if (item.type === KnowledgeRelationType.TOPIC) {
        setTopicId(item.rawId);
      } else if (item.type === KnowledgeRelationType.LOCATION) {
        setLocationId(item.rawId);
        if (!locationLabel.trim()) {
          setLocationLabel(item.name);
        }
      } else {
        // PERSON, FORCE, ARTIFACT
        newEntityIds.push(item.rawId);
      }
    });

    if (newEntityIds.length > 0) {
      setSelectedEntityIds((prev) => Array.from(new Set([...prev, ...newEntityIds])));
    }
  };

  const handleRemoveKnowledgeItem = (id: string) => {
    if (id.startsWith('event:')) {
      const raw = id.replace('event:', '');
      if (parentId === raw) {
        setParentId('');
        setIsSubEvent(false);
      }
      setSelectedEntityIds((prev) => prev.filter((item) => item !== raw));
    } else if (id.startsWith('period:')) {
      setPeriodId('');
    } else if (id.startsWith('topic:')) {
      setTopicId('');
    } else if (id.startsWith('location:')) {
      setLocationId('');
    } else if (id.startsWith('entity:')) {
      const raw = id.replace('entity:', '');
      setSelectedEntityIds((prev) => prev.filter((item) => item !== raw));
    }
  };

  // Quản lý quan hệ nhân quả sự kiện (Causal Relations)
  const handleAddEventRelation = async () => {
    if (!newTargetEventId) {
      alert('Vui lòng chọn sự kiện liên kết.');
      return;
    }
    if (newTargetEventId === eventId) {
      alert('Sự kiện không thể tự liên kết với chính nó.');
      return;
    }

    if (isEditMode && eventId) {
      try {
        const created = await HistoricalEventApiService.addRelation(eventId, {
          targetEventId: newTargetEventId,
          relationType: newEventRelationType,
          description: newEventRelationDesc.trim() || undefined,
          status: newEventRelationStatus,
          sourceReference: newEventRelationRef.trim() || undefined,
        });

        const targetEv = otherEvents.find((e) => e.id === newTargetEventId);
        setEventRelations((prev) => [
          ...prev,
          {
            id: created.id,
            targetEventId: newTargetEventId,
            relationType: newEventRelationType,
            description: newEventRelationDesc.trim(),
            status: newEventRelationStatus,
            sourceReference: newEventRelationRef.trim(),
            targetEvent: targetEv,
          },
        ]);

        setNewTargetEventId('');
        setNewEventRelationDesc('');
        setNewEventRelationRef('');
      } catch (err) {
        console.error('Failed to add event relation:', err);
        alert(extractErrorMessage(err, 'Không thể thêm mối quan hệ sự kiện.'));
      }
    } else {
      // Trong chế độ tạo mới (chưa có eventId), lưu tạm vào local state
      const targetEv = otherEvents.find((e) => e.id === newTargetEventId);
      setEventRelations((prev) => [
        ...prev,
        {
          targetEventId: newTargetEventId,
          relationType: newEventRelationType,
          description: newEventRelationDesc.trim(),
          status: newEventRelationStatus,
          sourceReference: newEventRelationRef.trim(),
          targetEvent: targetEv,
        },
      ]);
      setNewTargetEventId('');
      setNewEventRelationDesc('');
      setNewEventRelationRef('');
    }
  };

  const handleRemoveEventRelation = async (relId?: string, targetId?: string) => {
    if (isEditMode && relId) {
      try {
        await HistoricalEventApiService.removeRelation(relId);
        setEventRelations((prev) => prev.filter((r) => r.id !== relId));
      } catch (err) {
        console.error('Failed to remove event relation:', err);
        alert(extractErrorMessage(err, 'Không thể xóa mối quan hệ sự kiện.'));
      }
    } else {
      setEventRelations((prev) =>
        prev.filter((r) => (relId ? r.id !== relId : r.targetEventId !== targetId)),
      );
    }
  };

  // Nút "Sao chép dữ liệu mẫu" trên Header như abc.png
  const handleFillSampleData = () => {
    const sampleTitle = 'Mở tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh';
    setTitle(sampleTitle);
    const battle = categoryGroup?.terms.find((t) => t.code === EventCategory.BATTLE);
    if (battle) setCategoryIds([battle.id]);
    setMetadata({
      belligerents: ['Quân đội Nhân dân Việt Nam', 'Quân đội Hoa Kỳ và Việt Nam Cộng hòa'],
      commanders: ['Võ Bẩm', 'Đồng Sỹ Nguyên'],
      strength: 'Hàng chục vạn chiến sĩ công binh, thanh niên xung phong, bộ đội Trường Sơn',
      casualties: 'Hơn 2 vạn cán bộ, chiến sĩ anh dũng hy sinh',
      tactics: 'Vận chuyển cơ giới kết hợp gùi thồ, xẻ dọc Trường Sơn đi cứu nước',
    });
    setTimelineMode(TimelineMode.RANGE);
    setStartDateInput('19/05/1959');
    setStartIsBce(false);
    setEndDateInput('30/04/1975');
    setEndIsBce(false);
    setIsCustomDisplayMode(false);
    setLocationLabel('Dãy Trường Sơn');
    setSummary(
      'Tuyến vận tải chiến lược huyết mạch xuyên dãy Trường Sơn chi viện sức người, sức của từ hậu phương lớn miền Bắc cho tiền tuyến lớn miền Nam (1959 - 1975).',
    );
    setDescription(
      '<p><strong>Bối cảnh & Nguyên nhân:</strong> Cách mạng miền Nam chuyển sang thế tiến công sau Nghị quyết Trung ương 15 (1959), đòi hỏi tuyến giao thông quân sự huyết mạch xuyên dãy Trường Sơn.</p><p><strong>Diễn biến:</strong> Ngày 19/5/1959, Quân ủy Trung ương quyết định thành lập <strong>Đoàn công tác quân sự đặc biệt (Đoàn 559)</strong> do Thượng tá Võ Bẩm làm Đoàn trưởng, mở tuyến vận tải chiến lược Trường Sơn chi viện sức người, sức của từ hậu phương lớn miền Bắc cho tiền tuyến lớn miền Nam.</p><p><strong>Kết quả & Ý nghĩa:</strong> Xây dựng mạng lưới đường bộ và đường ống xăng dầu dài gần 20.000 km, góp phần quyết định vào Đại thắng mùa Xuân năm 1975.</p>',
    );
    setThumbnailUrl(
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
    );
    setSourceReferenceNote(
      'Sách giáo khoa Lịch sử 12, NXB Giáo dục Việt Nam; Lịch sử Bộ đội Trường Sơn - Đường Hồ Chí Minh',
    );
    if (periods[0]) setPeriodId(periods[0].id);
    const truongSonLoc = locations.find((l) => l.name.includes('Trường Sơn'));
    if (truongSonLoc) setLocationId(truongSonLoc.id);

    const sampleIds = new Set<string>();
    const personEntities = entities.filter((e) => isPersonEntityType(e.type));
    const forceEntities = entities.filter((e) => isForceEntityType(e.type));
    const artifactEntities = entities.filter((e) => isArtifactEntityType(e.type));

    const samplePerson =
      personEntities.find(
        (e: EntityOption) =>
          e.name.includes('Hồ Chí Minh') ||
          e.name.includes('Võ Bẩm') ||
          e.name.includes('Đồng Sỹ Nguyên'),
      ) || personEntities[0];
    if (samplePerson) sampleIds.add(samplePerson.id);

    const sampleForce =
      forceEntities.find((e: EntityOption) => e.name.includes('Đoàn 559')) ||
      forceEntities[0];
    if (sampleForce) sampleIds.add(sampleForce.id);

    const sampleArtifact =
      artifactEntities.find((e: EntityOption) => e.name.toLowerCase().includes('zil')) ||
      artifactEntities[0];
    if (sampleArtifact) sampleIds.add(sampleArtifact.id);

    if (sampleIds.size > 0) {
      setSelectedEntityIds(Array.from(sampleIds));
    }

    setMediaList([
      {
        type: 'IMAGE' as any,
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
        caption: 'Đoàn xe vận tải quân sự vượt Trường Sơn chi viện tiền tuyến',
        displayOrder: 1,
      },
      {
        type: 'VIDEO' as any,
        url: 'https://www.youtube.com/watch?v=sample-truong-son',
        caption: 'Phim tài liệu: Huyền thoại đường Trường Sơn',
        displayOrder: 2,
      },
      {
        type: 'DOCUMENT' as any,
        url: 'https://example.com/tai-lieu-duong-truong-son.pdf',
        caption: 'Tài liệu tham khảo: Lịch sử Bộ đội Trường Sơn',
        displayOrder: 3,
      },
    ]);
  };

  // Checklist 4 mục kiểm duyệt chuẩn như abc.png: Tên sự kiện, Niên đại, Mô tả, Nguồn và quan hệ
  const reviewChecklist: DataCompletenessItem[] = useMemo(
    () => [
      {
        label: 'Tên sự kiện',
        description: title.trim()
          ? 'Đã nhập'
          : 'Chưa nhập tên sự kiện lịch sử',
        completed: Boolean(title.trim()),
        required: true,
      },
      {
        label: 'Niên đại',
        description: parsedStart.valid
          ? `Đã nhập (${eventDateNote || autoDisplayText})`
          : 'Chưa nhập mốc thời gian hợp lệ',
        completed: parsedStart.valid,
        required: true,
      },
      {
        label: 'Mô tả',
        description:
          summary.trim() || description.trim()
            ? 'Đã có mô tả'
            : 'Chưa nhập mô tả diễn biến lịch sử',
        completed: Boolean(summary.trim() || description.trim()),
        required: true,
      },
      {
        label: 'Nguồn và quan hệ',
        description:
          (periodId || topicId) &&
          selectedEntityIds.length > 0 &&
          sourceReferenceNote.trim()
            ? `Đã liên kết giai đoạn, ${selectedEntityIds.length} thực thể lịch sử và nguồn sử liệu`
            : 'Cần xác minh theo dữ liệu thực tế trước khi xuất bản.',
        completed: Boolean(
          (periodId || topicId) &&
            selectedEntityIds.length > 0 &&
            sourceReferenceNote.trim(),
        ),
      },
    ],
    [
      title,
      parsedStart.valid,
      eventDateNote,
      autoDisplayText,
      summary,
      description,
      periodId,
      topicId,
      selectedEntityIds,
      sourceReferenceNote,
    ],
  );

  const handleSave = async (action: 'DRAFT' | 'PUBLISH') => {
    if (!title.trim()) {
      alert('Vui lòng nhập Tên sự kiện lịch sử.');
      return;
    }

    if (!parsedStart.valid || parsedStart.signedYear === null) {
      alert(
        parsedStart.error ||
          'Vui lòng nhập Mốc bắt đầu hợp lệ theo định dạng DD/MM/YYYY hoặc YYYY (VD: 19/05/1959 hoặc 1959).',
      );
      return;
    }

    let signedEndYear: number | null = null;
    let endMonthVal: number | null = null;
    let endDayVal: number | null = null;

    if (timelineMode === TimelineMode.RANGE && endDateInput.trim()) {
      if (!parsedEnd.valid || parsedEnd.signedYear === null) {
        alert(
          parsedEnd.error ||
            'Mốc kết thúc không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY hoặc YYYY.',
        );
        return;
      }
      if (parsedEnd.signedYear < parsedStart.signedYear) {
        alert('Mốc kết thúc không được nhỏ hơn mốc bắt đầu sự kiện.');
        return;
      }
      signedEndYear = parsedEnd.signedYear;
      endMonthVal = parsedEnd.month;
      endDayVal = parsedEnd.day;
    }

    const finalDisplayNote =
      eventDateNote.trim() || autoDisplayText || undefined;

    const targetStatus =
      action === 'DRAFT' ? ContentStatus.DRAFT : status || ContentStatus.PUBLISHED;

    const mergedMetadata: Record<string, any> = {
      ...metadata,
      ...(sourceReferenceNote.trim() ? { sourceReferenceNote: sourceReferenceNote.trim() } : {}),
      ...(locationLabel.trim() ? { rawLocation: locationLabel.trim() } : {}),
    };

    const payload: SaveHistoricalEventPayload = {
      title: title.trim(),
      slug: (isCustomSlugMode && customSlug.trim()) ? customSlug.trim() : (autoSlugPreview || undefined),
      startYear: parsedStart.signedYear,
      startMonth: parsedStart.month,
      startDay: parsedStart.day,
      endYear: signedEndYear,
      endMonth: endMonthVal,
      endDay: endDayVal,
      eventDateNote: finalDisplayNote,
      summary: summary.trim() || undefined,
      description: description.trim() || summary.trim() || undefined,
      periodId: periodId || undefined,
      topicId: topicId || undefined,
      locationId: locationId || undefined,
      parentId: parentId ? parentId : null,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      status: action === 'PUBLISH' ? ContentStatus.PUBLISHED : targetStatus,
      categoryIds,
      metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      // Gửi kèm vai trò để lưu không làm mất vai trò / mô tả đã có.
      entityRelations: selectedEntityIds.map((entityId, idx) => {
        const value = entityRoles[entityId] ?? emptyEventRole(entities.find((e) => e.id === entityId)?.type);
        return {
          entityId,
          role: value.role,
          roleLabel: value.roleLabel.trim() || null,
          isPrimary: value.isPrimary,
          displayOrder: idx,
          notes: value.notes,
        };
      }),
      media: mediaList.map((m, idx) => ({
        type: m.type,
        url: m.url,
        caption: m.caption,
        displayOrder: m.displayOrder ?? idx + 1,
      })),
    };

    try {
      setSavingAction(action);
      if (isEditMode && eventId) {
        const updated = await HistoricalEventApiService.updateEvent(
          eventId,
          payload,
        );
        if (isRevisionPending(updated)) {
          // Nội dung đang xuất bản: thay đổi thành bản sửa chờ duyệt, bản công khai giữ nguyên.
          setPendingRevision(updated.revision);
          setRevisionNotice(updated.message);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setStatus(updated.status || payload.status || ContentStatus.PUBLISHED);
        setUpdatedAt(updated.updatedAt || new Date().toISOString());
        if (action === 'DRAFT') {
          setLastDraftSavedAt(new Date().toLocaleTimeString('vi-VN'));
        }
      } else {
        const created = await HistoricalEventApiService.createEvent(payload);
        if (action === 'DRAFT') {
          setLastDraftSavedAt(new Date().toLocaleTimeString('vi-VN'));
          // Nếu tạo mới ở dạng nháp, chuyển sang chế độ edit của bản ghi vừa tạo
          if (created?.id) {
            router.replace(`${APP_ROUTES.EVENTS.LIST}/${created.id}`);
            return;
          }
        }
      }
      if (action === 'PUBLISH') {
        router.push(APP_ROUTES.EVENTS.LIST);
      }
    } catch (err) {
      console.error('Failed to save historical event:', err);
      alert(extractErrorMessage(err, 'Không thể lưu thông tin Sự kiện lịch sử.'));
    } finally {
      setSavingAction(null);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <span>Đang tải hồ sơ Sự kiện lịch sử...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ĐỊNH NGHĨA 6 PHẦN CỦA BIỂU MẪU (TRÙNG KHỚP 100% VỚI LEFT BAR TRONG abc.png)
  // ---------------------------------------------------------------------------
  const sections: FormSectionConfig[] = [
    {
      id: 'basic-info',
      stepNumber: 1,
      title: 'Thông tin cơ bản',
      subtitle: 'Tên sự kiện, tóm tắt ngắn và ảnh đại diện.',
      icon: IconName.FILE,
      content: (
        <div className="space-y-5">
          {/* Thông báo trạng thái lưu nháp (Draft status pill) */}
          {lastDraftSavedAt && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đã lưu bản nháp lúc {lastDraftSavedAt}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Cột trái: Nhập thông tin (Chiếm trọn không gian ưu tiên nội dung) */}
            <div className="flex-1 w-full space-y-4">
              {/* Tên sự kiện */}
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Tên sự kiện lịch sử <b className="text-rose-500">*</b>
                </span>
                <input
                  type="text"
                  value={title}
                  onBlur={() => setTitleTouched(true)}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!titleTouched) setTitleTouched(true);
                  }}
                  placeholder="Ví dụ: Phong trào Đồng Khởi Bến Tre bùng nổ"
                  required
                  className={`w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none transition ${
                    titleTouched && !title.trim()
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-200 focus:border-amber-500'
                  }`}
                />
                {titleTouched && !title.trim() && (
                  <span className="text-[11px] text-rose-500 font-medium mt-1 block">
                    ⚠️ Vui lòng nhập tên sự kiện lịch sử (trường bắt buộc).
                  </span>
                )}

                {/* Mã định danh (Slug) tự động + Cho phép xem trước và chỉnh sửa */}
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <span>🔗 Đường dẫn tĩnh (Slug):</span>
                      <code className="text-amber-800 font-mono font-semibold">
                        /su-kien/{activeSlug || 'chua-co-slug'}
                      </code>
                    </span>
                    {status !== ContentStatus.PUBLISHED ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCustomSlugMode) {
                            setCustomSlug(activeSlug);
                            setIsCustomSlugMode(true);
                          } else {
                            setIsCustomSlugMode(false);
                          }
                        }}
                        className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        {isCustomSlugMode ? 'Tự động theo tên' : 'Chỉnh sửa slug'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        (Đã xuất bản - Khóa URL để bảo vệ SEO)
                      </span>
                    )}
                  </div>

                  {isCustomSlugMode && status !== ContentStatus.PUBLISHED && (
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-slate-400 font-mono">/su-kien/</span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) =>
                          setCustomSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, '-'),
                          )
                        }
                        placeholder="tuy-chinh-duong-dan"
                        className="flex-1 text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              </label>

              {/* Loại sự kiện theo cây danh mục dùng chung + thông tin riêng theo loại */}
              <div className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Loại sự kiện <b className="text-rose-500">*</b>
                </span>
                <EventCategoryPanel
                  group={categoryGroup}
                  value={categoryIds}
                  onChange={setCategoryIds}
                  metadata={metadata}
                  onMetadataChange={setMetadata}
                />
              </div>

              {/* Tóm tắt ngắn: Chiều cao ban đầu 130px, tự co giãn, có thanh cuộn và đếm ký tự */}
              <label className="block">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Tóm tắt ngắn (Preview Card)
                  </span>
                  <span
                    className={`text-[11px] font-mono ${
                      summary.length > 300
                        ? 'text-amber-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {summary.length}/300 ký tự gợi ý
                  </span>
                </div>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Tóm tắt 2-3 dòng khái quát sự kiện, hiển thị trên thẻ card danh sách và kết quả tìm kiếm..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition leading-relaxed min-h-[130px] max-h-[260px] resize-y overflow-y-auto"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  💡 Giữ cô đọng từ 100 - 250 ký tự để card hiển thị đẹp nhất trên di động và màn hình lớn.
                </span>
              </label>
            </div>

            {/* Cột phải: Khung ảnh đại diện gọn gàng (Cố định khoảng 230px, không lấn át không gian bài viết) */}
            <div className="w-full lg:w-[230px] shrink-0">
              <TopicCoverImagePicker
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                title="Ảnh đại diện"
                compact
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'time-and-location',
      stepNumber: 2,
      title: 'Thời gian & địa điểm',
      subtitle: 'Xác định thời gian và địa điểm diễn ra sự kiện.',
      icon: IconName.CALENDAR,
      content: (
        <div className="space-y-4">
          {/* Tái sử dụng component chuẩn SOLID cho 3 cụm điều khiển thời gian lịch sử */}
          <HistoricalDateRangeField
            timelineMode={timelineMode}
            onTimelineModeChange={setTimelineMode}
            startDateInput={startDateInput}
            onStartDateInputChange={setStartDateInput}
            startIsBce={startIsBce}
            onStartIsBceChange={setStartIsBce}
            parsedStart={parsedStart}
            endDateInput={endDateInput}
            onEndDateInputChange={setEndDateInput}
            endIsBce={endIsBce}
            onEndIsBceChange={setEndIsBce}
            parsedEnd={parsedEnd}
            displayValue={eventDateNote}
            onDisplayValueChange={setEventDateNote}
            isCustomDisplayMode={isCustomDisplayMode}
            onToggleCustomDisplayMode={() => {
              if (isCustomDisplayMode) {
                setIsCustomDisplayMode(false);
                setEventDateNote(autoDisplayText);
              } else {
                setIsCustomDisplayMode(true);
              }
            }}
          />

          {/* Địa điểm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                Liên kết Địa danh & Di tích
              </span>
              <select
                value={locationId}
                onChange={(e) => handleSelectLocation(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Chọn địa danh trong Từ điển --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                Tên địa điểm hiển thị
              </span>
              <input
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="Ví dụ: Mỏ Cày, Bến Tre"
                className="w-full text-xs px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'historical-content',
      stepNumber: 3,
      title: 'Nội dung lịch sử',
      subtitle: 'Soạn thảo nội dung diễn biến chi tiết và hình ảnh tư liệu.',
      icon: IconName.BOOK,
      content: (
        <div className="space-y-4">
          {/* Soạn thảo nội dung diễn biến chi tiết duy nhất */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-50/80 px-3.5 py-2 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Nội dung & Diễn biến sự kiện (kèm hình ảnh/media)</span>
            </div>
            <TipTapContent
              value={description}
              onChange={setDescription}
              placeholder="Soạn thảo bối cảnh, diễn biến chi tiết và ý nghĩa lịch sử của sự kiện..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'knowledge-graph',
      stepNumber: 4,
      title: 'Mối liên hệ & Đồ thị nhân quả',
      subtitle:
        'Thiết lập mạng lưới quan hệ nhân quả (nguyên nhân, hệ quả, tiền đề) giữa các sự kiện và liên kết kho tri thức.',
      icon: IconName.USERS,
      content: (
        <div className="space-y-6">
          {/* Cụm 1: Mạng lưới quan hệ nhân quả giữa các sự kiện (HistoricalEventRelation N-N) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Quan hệ nhân quả giữa các Sự kiện ({eventRelations.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Đồ thị tri thức & Mạng lưới quan hệ sự kiện
              </span>
            </div>

            {/* Form tạo liên kết quan hệ mới: Grid chuẩn Hàng 1 (50%-50%), Hàng 2 (25%-25%-50%) */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                + Thêm mối liên hệ sự kiện mới
              </span>

              {/* Hàng 1: Sự kiện liên kết (50%) + Mối quan hệ (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Sự kiện liên kết <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTargetEventId}
                    onChange={(e) => setNewTargetEventId(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="">-- Chọn sự kiện đích liên kết --</option>
                    {otherEvents
                      .filter((ev) => ev.id !== eventId)
                      .map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} {ev.startYear ? `(${ev.startYear})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Mối quan hệ nhân quả <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newEventRelationType}
                    onChange={(e) =>
                      setNewEventRelationType(e.target.value)
                    }
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  >
                    {relationOptions(relationGroup?.terms ?? [], EVENT_RELATION_TYPE_LABELS, newEventRelationType).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hàng 2: Trạng thái (25%) + Nguồn chứng minh (25%) + Giải thích mối liên hệ (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Trạng thái xác minh
                  </label>
                  <select
                    value={newEventRelationStatus}
                    onChange={(e) =>
                      setNewEventRelationStatus(e.target.value as VerificationStatus)
                    }
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  >
                    {Object.entries(VERIFICATION_STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Nguồn chứng minh
                  </label>
                  <input
                    type="text"
                    value={newEventRelationRef}
                    onChange={(e) => setNewEventRelationRef(e.target.value)}
                    placeholder="VD: Đại Việt Sử Ký..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Giải thích mối liên hệ
                  </label>
                  <input
                    type="text"
                    value={newEventRelationDesc}
                    onChange={(e) => setNewEventRelationDesc(e.target.value)}
                    placeholder="Mô tả cụ thể tác động hoặc bối cảnh diễn ra..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="text-right pt-1">
                <button
                  type="button"
                  onClick={handleAddEventRelation}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-2xs"
                >
                  Gắn liên kết quan hệ
                </button>
              </div>
            </div>

            {/* Danh sách các quan hệ nhân quả đã gắn */}
            {eventRelations.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                <div className="px-3.5 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
                  <span className="col-span-4">Sự kiện liên kết</span>
                  <span className="col-span-3">Mối quan hệ</span>
                  <span className="col-span-4">Xác minh & Giải thích</span>
                  <span className="col-span-1 text-right">Xóa</span>
                </div>
                {eventRelations.map((rel, idx) => {
                  const target =
                    rel.targetEvent || otherEvents.find((e) => e.id === rel.targetEventId);
                  return (
                    <div
                      key={rel.id || `${rel.targetEventId}-${idx}`}
                      className="px-3.5 py-2.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition"
                    >
                      <div className="col-span-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <span>{target?.title || rel.targetEventId}</span>
                      </div>
                      <div className="col-span-3 text-indigo-700 font-medium">
                        {relationLabel(relationGroup?.terms ?? [], rel.relationType, 'OUTGOING', EVENT_RELATION_TYPE_LABELS)}
                      </div>
                      <div className="col-span-4 text-slate-600 text-[11px] truncate">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 mr-1.5">
                          {VERIFICATION_STATUS_LABELS[rel.status as VerificationStatus] || rel.status}
                        </span>
                        {rel.description || (rel.sourceReference ? `Nguồn: ${rel.sourceReference}` : '—')}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveEventRelation(rel.id, rel.targetEventId)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Hủy liên kết"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Chưa có quan hệ nhân quả nào được thiết lập. Hãy thêm mối quan hệ ở trên.
              </p>
            )}

            {/* Hiển thị các quan hệ hướng đến sự kiện này (Incoming relations) */}
            {incomingEventRelations.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Được liên kết từ các sự kiện khác ({incomingEventRelations.length}):
                </span>
                <div className="space-y-1">
                  {incomingEventRelations.map((inc) => (
                    <div
                      key={inc.id}
                      className="text-xs px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-slate-600"
                    >
                      <span>
                        <b className="text-slate-800">{inc.sourceEvent?.title || inc.sourceEventId}</b> → {relationLabel(relationGroup?.terms ?? [], inc.relationType, 'OUTGOING', EVENT_RELATION_TYPE_LABELS)} → Sự kiện này
                      </span>
                      {inc.description && <span className="text-[11px] text-slate-400 italic">{inc.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cụm 2: Liên kết tri thức liên quan (Nhân vật, Thời kỳ, Địa điểm) */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
              Liên kết Thực thể & Bối cảnh (Nhân vật, Thời kỳ, Địa điểm)
            </span>
            <KnowledgeRelationManager
              availableItems={availableKnowledgeItems}
              linkedItems={linkedKnowledgeItems}
              onAddItems={handleAddKnowledgeItems}
              onRemoveItem={handleRemoveKnowledgeItem}
            />
            <EventEntityRoles
              group={roleGroup}
              entities={selectedEntityIds
                .filter((id) => id !== parentId)
                .map((id) => entities.find((e) => e.id === id))
                .filter((e): e is NonNullable<typeof e> => Boolean(e))}
              roles={entityRoles}
              onChange={setEntityRoles}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'media-and-sources',
      stepNumber: 5,
      title: 'Tài liệu',
      subtitle:
        'Tải ảnh tư liệu lịch sử từ máy tính (hoặc dán liên kết URL) và ghi chú xuất xứ nguồn sử liệu chính thống.',
      icon: IconName.FILE,
      content: (
        <div className="space-y-5">
          {/* Tái sử dụng TopicCoverImagePicker cho phép Tải file lên + Dán URL ảnh tư liệu */}
          <TopicCoverImagePicker
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            title="Ảnh tư liệu chính / Ảnh bìa sự kiện"
          />

          {/* Quản lý danh sách đa tư liệu (Ảnh, Tài liệu PDF/Word, Video YouTube) */}
          <LessonMediaManager
            mediaList={mediaList}
            onAddMedia={handleAddMedia}
            onRemoveMedia={handleRemoveMedia}
          />

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nguồn sử liệu tham khảo, chú thích & xuất xứ
            </span>
            <textarea
              rows={3}
              value={sourceReferenceNote}
              onChange={(e) => setSourceReferenceNote(e.target.value)}
              placeholder="Ví dụ: Sách giáo khoa Lịch sử 12, NXB Giáo dục Việt Nam; Văn kiện Đảng Toàn tập..."
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>
      ),
    },
    {
      id: 'review-and-publish',
      stepNumber: 6,
      title: 'Kiểm duyệt & xuất bản',
      subtitle: 'Kiểm tra dữ liệu trước khi hiển thị trên trang học lịch sử.',
      icon: IconName.CHECK,
      content: (
        <div className="space-y-5">
          {/* Khung Checklist 4 mục giống hệt abc.png */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3.5">
            {reviewChecklist.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${
                    item.completed
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {item.completed ? '✓' : '!'}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trạng thái Radio Group giống hệt abc.png */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800">Trạng thái</div>
            <div className="space-y-2">
              {[
                {
                  value: ContentStatus.DRAFT,
                  label: 'Bản nháp',
                },
                {
                  value: ContentStatus.PENDING_REVIEW,
                  label: 'Chờ kiểm duyệt',
                },
                {
                  value: ContentStatus.PUBLISHED,
                  label: 'Đã xuất bản',
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 text-xs font-medium text-slate-800 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="event_status"
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    className="w-4 h-4 text-amber-700 focus:ring-amber-500 border-slate-300"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Hộp Lưu ý giống abc.png */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-1">
            <div className="font-bold text-white">Lưu ý</div>
            <p className="text-slate-300 leading-relaxed">
              Hệ thống sẽ lưu trực tiếp vào cơ sở dữ liệu PostgreSQL, đồng bộ liên kết Đồ thị Tri thức (Knowledge Graph) và làm mới bộ nhớ đệm trước khi hiển thị trên Timeline lịch sử.
            </p>
            {(createdAt || updatedAt) && (
              <div className="pt-2 text-[11px] text-slate-400 font-mono">
                {createdAt && (
                  <span>
                    Khởi tạo: {new Date(createdAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {updatedAt && (
                  <span className="ml-4">
                    Cập nhật: {new Date(updatedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <EntityDetailLayout
        breadcrumbs={[
          { label: 'CMS', href: APP_ROUTES.DASHBOARD },
          { label: 'Từ điển tri thức', href: APP_ROUTES.KNOWLEDGE },
          { label: 'Sự kiện', href: APP_ROUTES.EVENTS.LIST },
          { label: isEditMode ? 'Chỉnh sửa' : 'Tạo mới' },
        ]}
        title={isEditMode ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
        subtitle="Quản lý thông tin và các mối liên hệ lịch sử."
        recordId={eventId}
        status={status}
        savingAction={savingAction}
        onSaveDraft={() => handleSave('DRAFT')}
        onPublish={() => handleSave('PUBLISH')}
        onCancel={() => router.push(APP_ROUTES.EVENTS.LIST)}
        onFillSampleData={handleFillSampleData}
        onPreview={() => setIsPreviewOpen(true)}
        sections={sections}
        banner={
          <EditorRevisionBanner
            type="EVENT"
            contentId={eventId}
            status={status}
            pending={pendingRevision}
            notice={revisionNotice}
            onChanged={(message) => {
              setRevisionNotice(message);
              void loadReferenceDataAndDetail();
            }}
          />
        }
      />

      {/* Modal Xem trước Sự kiện lịch sử */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-amber-700 font-bold">
                  Xem trước thẻ Sự kiện trên Timeline
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {title || 'Chưa nhập tên sự kiện'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {thumbnailUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-56">
                <img
                  src={thumbnailUrl}
                  alt={title || 'Ảnh tư liệu sự kiện'}
                  className="w-full h-52 object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span className="font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded">
                {eventDateNote || autoDisplayText || 'Chưa nhập thời gian'}
              </span>
              {locationLabel && <span>• 📍 {locationLabel}</span>}
            </div>

            {summary && (
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                <b className="block text-slate-900 mb-1">Tóm tắt ngắn:</b>
                <p>{summary}</p>
              </div>
            )}

            {description && (
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <b className="block text-slate-900 mb-1.5">Nội dung chi tiết:</b>
                <div
                  className="prose prose-xs max-w-none text-slate-700 space-y-1.5"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            )}

            {sourceReferenceNote && (
              <div className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-2">
                Nguồn sử liệu: {sourceReferenceNote}
              </div>
            )}

            {mediaList.length > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <b className="block text-xs text-slate-900">
                  Tư liệu đính kèm ({mediaList.length}):
                </b>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {mediaList.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <span className="truncate text-slate-700 font-medium">
                        {m.type === 'VIDEO' ? '🎥 Video' : m.type === 'DOCUMENT' ? '📄 Tài liệu' : '🖼 Ảnh'}: {m.caption || m.url}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
