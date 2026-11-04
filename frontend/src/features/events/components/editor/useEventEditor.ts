'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ContentStatus,
  ContentAction,
  DatePrecision,
  EntityType,
  EventCategory,
  EventRelationType,
  VerificationStatus,
  TaxonomyGroupCode,
} from '@/constants/enums';
import { APP_ROUTES, SAMPLE_REMOTE_LINKS } from '@/constants/routes';
import {
  TaxonomyApiService,
  type TaxonomyGroupItem,
} from '@/services/entities/taxonomy.service';
import {
  HistoricalEventApiService,
  type SaveHistoricalEventPayload,
} from '@/services/entities/historical-event.service';
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';
import api, { extractErrorMessage, parsePaginatedResponse } from '@/services/api';
import {
  TimelineMode,
  parseFlexibleHistoricalDate,
  formatRecordToFlexibleDateInput,
  buildSuggestedEventDisplayString,
  formatHistoricalYear,
} from '@/utils/history-year.utils';
import {
  KnowledgeRelationType,
  type KnowledgeRelationItem,
} from '@/components/common/KnowledgeRelationManager';
import { emptyEventRole, type EventEntityRoleValue } from '../EventEntityRoles';
import type {
  PeriodOption,
  TopicOption,
  LocationOption,
  OtherEventOption,
  EntityOption,
  EventCausalRelationItem,
  IncomingEventRelationItem,
} from './editor.types';
import type { CompletenessCheckItem } from './EventReviewPublishStep';
import type { LessonMediaItem } from '@/features/lessons/types/editor.types';

const SAMPLE_START_DATE = '19/05/1959';
const SAMPLE_END_DATE = '30/04/1975';
const LABEL_SUBTITLE_PERIOD = 'Thời kỳ lịch sử';
const LABEL_SUBTITLE_TOPIC = 'Chủ đề lịch sử';
const LABEL_SUBTITLE_LOCATION = 'Địa danh lịch sử';

const LEGACY_PERSON_TYPES: readonly string[] = ['FIGURE', 'HISTORICAL_FIGURE'];

function isPersonEntityType(type?: string | null): boolean {
  return (
    type === EntityType.PERSON ||
    Boolean(type && LEGACY_PERSON_TYPES.includes(type)) ||
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

export function useEventEditor(eventId?: string) {
  const router = useRouter();
  const isEditMode = Boolean(eventId);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingAction, setSavingAction] = useState<'DRAFT' | 'PUBLISH' | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Dữ liệu tham chiếu
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [otherEvents, setOtherEvents] = useState<OtherEventOption[]>([]);

  // Bước 1: Tổng quan
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categoryGroup, setCategoryGroup] = useState<TaxonomyGroupItem>();
  const [roleGroup, setRoleGroup] = useState<TaxonomyGroupItem>();
  const [relationGroup, setRelationGroup] = useState<TaxonomyGroupItem>();
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [legacyCategory, setLegacyCategory] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [summary, setSummary] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isCustomSlugMode, setIsCustomSlugMode] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Thời gian & Địa điểm (gộp vào Bước 1)
  const [timelineMode, setTimelineMode] = useState<TimelineMode>(TimelineMode.RANGE);
  const [startDateInput, setStartDateInput] = useState<string>(SAMPLE_START_DATE);
  const [startIsBce, setStartIsBce] = useState<boolean>(false);
  const [endDateInput, setEndDateInput] = useState<string>(SAMPLE_END_DATE);
  const [endIsBce, setEndIsBce] = useState<boolean>(false);
  const [eventDateNote, setEventDateNote] = useState('');
  const [isCustomDisplayMode, setIsCustomDisplayMode] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [locationLabel, setLocationLabel] = useState('');

  // Bước 2: Nội dung & Diễn biến (Studio Block Builder)
  const [description, setDescription] = useState('');
  const [contentBlocks, setContentBlocks] = useState<unknown>(null);
  const [mediaList, setMediaList] = useState<LessonMediaItem[]>([]);
  const [sourceReferenceNote, setSourceReferenceNote] = useState('');

  // Bước 3: Mạng lưới liên kết
  const [parentId, setParentId] = useState<string>('');
  const [isSubEvent, setIsSubEvent] = useState<boolean>(false);
  const [periodId, setPeriodId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [entityRoles, setEntityRoles] = useState<Record<string, EventEntityRoleValue>>({});
  const [eventRelations, setEventRelations] = useState<EventCausalRelationItem[]>([]);
  const [incomingEventRelations, setIncomingEventRelations] = useState<IncomingEventRelationItem[]>([]);

  // Bước 4: Kiểm duyệt & Xuất bản
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
    TaxonomyApiService.getGroups([
      TaxonomyGroupCode.EVENT_CATEGORY,
      TaxonomyGroupCode.EVENT_ROLE,
      TaxonomyGroupCode.EVENT_RELATION,
    ])
      .then((groups) => {
        setCategoryGroup(groups.find((g) => g.code === TaxonomyGroupCode.EVENT_CATEGORY));
        setRoleGroup(groups.find((g) => g.code === TaxonomyGroupCode.EVENT_ROLE));
        setRelationGroup(groups.find((g) => g.code === TaxonomyGroupCode.EVENT_RELATION));
      })
      .catch((err) => console.warn('Failed to fetch event taxonomies:', err));
  }, []);

  useEffect(() => {
    if (!legacyCategory || !categoryGroup) return;
    const lower = legacyCategory.toLowerCase();
    const term = categoryGroup.terms.find(
      (t) => t.code === legacyCategory || t.aliases.includes(lower),
    );
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

      const periodItems = parsePaginatedResponse<PeriodOption>(periodsRes.data).items;
      const topicItems = parsePaginatedResponse<TopicOption>(topicsRes.data).items;
      const locationItems = parsePaginatedResponse<LocationOption>(locationsRes.data).items;
      const entityItems = parsePaginatedResponse<EntityOption>(entitiesRes.data).items;
      const eventItems = parsePaginatedResponse<OtherEventOption>(eventsRes.data).items.filter(
        (ev) => !eventId || ev.id !== eventId,
      );

      setPeriods(periodItems);
      setTopics(topicItems);
      setLocations(locationItems);
      setEntities(entityItems);
      setOtherEvents(eventItems);

      if (isEditMode && eventId) {
        const fetched = await HistoricalEventApiService.getEventById(eventId);
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
          detail.historicalLocation?.name ||
            (detail.metadata?.rawLocation as string) ||
            '',
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
        const rawMeta =
          detail.metadata && typeof detail.metadata === 'object' && !Array.isArray(detail.metadata)
            ? (detail.metadata as Record<string, any>)
            : {};
        setMetadata(rawMeta);
        if (rawMeta.contentBlocks) {
          setContentBlocks(rawMeta.contentBlocks);
        } else if (detail.description) {
          setContentBlocks([
            {
              id: 'init-text-1',
              type: 'TEXT',
              order: 0,
              data: { content: detail.description },
            },
          ]);
        }
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

  const handleAddMedia = (item: LessonMediaItem) => {
    setMediaList((prev) => [...prev, item]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  // Kho tri thức tham chiếu
  const availableKnowledgeItems: KnowledgeRelationItem[] = useMemo(() => {
    const items: KnowledgeRelationItem[] = [];

    // Thời kỳ lịch sử (PERIOD)
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
        subtitle: LABEL_SUBTITLE_PERIOD,
        yearLabel,
      });
    });

    // Chủ đề liên kết (TOPIC)
    topics.forEach((t) => {
      items.push({
        id: `topic:${t.id}`,
        rawId: t.id,
        name: t.name,
        type: KnowledgeRelationType.TOPIC,
        typeLabel: 'Chủ đề',
        subtitle: t.eyebrow || LABEL_SUBTITLE_TOPIC,
      });
    });

    // Thực thể: Nhân vật, Lực lượng, Hiện vật
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
  }, [periods, topics, entities]);

  const linkedKnowledgeItems: KnowledgeRelationItem[] = useMemo(() => {
    const list: KnowledgeRelationItem[] = [];

    if (periodId) {
      const found = periods.find((p) => p.id === periodId);
      if (found) {
        list.push({
          id: `period:${found.id}`,
          rawId: found.id,
          name: found.name,
          type: KnowledgeRelationType.PERIOD,
          typeLabel: 'Thời kỳ',
          relationLabel: 'Thuộc thời kỳ',
          subtitle: LABEL_SUBTITLE_PERIOD,
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
          subtitle: found.eyebrow || LABEL_SUBTITLE_TOPIC,
        });
      }
    }

    selectedEntityIds.forEach((eid) => {
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
  }, [periodId, topicId, selectedEntityIds, parentId, periods, topics, entities]);

  const handleAddKnowledgeItems = (itemsToAdd: KnowledgeRelationItem[]) => {
    const newEntityIds: string[] = [];

    itemsToAdd.forEach((item) => {
      if (item.type === KnowledgeRelationType.PERIOD) {
        setPeriodId(item.rawId);
      } else if (item.type === KnowledgeRelationType.TOPIC) {
        setTopicId(item.rawId);
      } else {
        newEntityIds.push(item.rawId);
      }
    });

    if (newEntityIds.length > 0) {
      setSelectedEntityIds((prev) => Array.from(new Set([...prev, ...newEntityIds])));
    }
  };

  const handleRemoveKnowledgeItem = (id: string) => {
    if (id.startsWith('period:')) {
      setPeriodId('');
    } else if (id.startsWith('topic:')) {
      setTopicId('');
    } else if (id.startsWith('entity:')) {
      const raw = id.replace('entity:', '');
      setSelectedEntityIds((prev) => prev.filter((item) => item !== raw));
    }
  };

  const handleAddEventRelation = async (relation: {
    targetEventId: string;
    relationType: string;
    description?: string;
    status: VerificationStatus;
    sourceReference?: string;
  }) => {
    if (relation.targetEventId === eventId) {
      alert('Sự kiện không thể tự liên kết với chính nó.');
      return;
    }

    if (isEditMode && eventId) {
      try {
        const created = await HistoricalEventApiService.addRelation(eventId, {
          targetEventId: relation.targetEventId,
          relationType: relation.relationType,
          description: relation.description,
          status: relation.status,
          sourceReference: relation.sourceReference,
        });

        const targetEv = otherEvents.find((e) => e.id === relation.targetEventId);
        setEventRelations((prev) => [
          ...prev,
          {
            id: created.id,
            targetEventId: relation.targetEventId,
            relationType: relation.relationType,
            description: relation.description,
            status: relation.status,
            sourceReference: relation.sourceReference,
            targetEvent: targetEv,
          },
        ]);
      } catch (err) {
        console.error('Failed to add event relation:', err);
        alert(extractErrorMessage(err, 'Không thể thêm mối quan hệ sự kiện.'));
      }
    } else {
      const targetEv = otherEvents.find((e) => e.id === relation.targetEventId);
      setEventRelations((prev) => [
        ...prev,
        {
          targetEventId: relation.targetEventId,
          relationType: relation.relationType,
          description: relation.description,
          status: relation.status,
          sourceReference: relation.sourceReference,
          targetEvent: targetEv,
        },
      ]);
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
    setStartDateInput(SAMPLE_START_DATE);
    setStartIsBce(false);
    setEndDateInput(SAMPLE_END_DATE);
    setEndIsBce(false);
    setIsCustomDisplayMode(false);
    setLocationLabel('Dãy Trường Sơn');
    setSummary(
      'Tuyến vận tải chiến lược huyết mạch xuyên dãy Trường Sơn chi viện sức người, sức của từ hậu phương lớn miền Bắc cho tiền tuyến lớn miền Nam (1959 - 1975).',
    );
    setDescription(
      '<p><strong>Bối cảnh & Nguyên nhân:</strong> Cách mạng miền Nam chuyển sang thế tiến công sau Nghị quyết Trung ương 15 (1959), đòi hỏi tuyến giao thông quân sự huyết mạch xuyên dãy Trường Sơn.</p><p><strong>Diễn biến:</strong> Ngày 19/5/1959, Quân ủy Trung ương quyết định thành lập <strong>Đoàn công tác quân sự đặc biệt (Đoàn 559)</strong> do Thượng tá Võ Bẩm làm Đoàn trưởng, mở tuyến vận tải chiến lược Trường Sơn chi viện sức người, sức của từ hậu phương lớn miền Bắc cho tiền tuyến lớn miền Nam.</p><p><strong>Kết quả & Ý nghĩa:</strong> Xây dựng mạng lưới đường bộ và đường ống xăng dầu dài gần 20.000 km, góp phần quyết định vào Đại thắng mùa Xuân năm 1975.</p>',
    );
    setThumbnailUrl(SAMPLE_REMOTE_LINKS.TRUONG_SON_IMAGE);
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
        url: SAMPLE_REMOTE_LINKS.TRUONG_SON_IMAGE,
        caption: 'Đoàn xe vận tải quân sự vượt Trường Sơn chi viện tiền tuyến',
        displayOrder: 1,
      },
      {
        type: 'VIDEO' as any,
        url: SAMPLE_REMOTE_LINKS.TRUONG_SON_VIDEO,
        caption: 'Phim tài liệu: Huyền thoại đường Trường Sơn',
        displayOrder: 2,
      },
      {
        type: 'DOCUMENT' as any,
        url: SAMPLE_REMOTE_LINKS.TRUONG_SON_DOCUMENT,
        caption: 'Tài liệu tham khảo: Lịch sử Bộ đội Trường Sơn',
        displayOrder: 3,
      },
    ]);
  };

  // Checklist 4 mục kiểm duyệt thông minh, có targetStepIndex để bấm nhảy tới đúng bước!
  const reviewChecklist: CompletenessCheckItem[] = useMemo(
    () => [
      {
        id: 'title',
        label: 'Tên sự kiện lịch sử',
        description: title.trim() ? 'Đã nhập tên sự kiện' : 'Chưa nhập tên sự kiện lịch sử',
        completed: Boolean(title.trim()),
        required: true,
        targetStepIndex: 0, // Bước 1: Tổng quan
      },
      {
        id: 'date',
        label: 'Niên đại & Thời gian',
        description: parsedStart.valid
          ? `Đã xác lập (${eventDateNote || autoDisplayText})`
          : 'Chưa nhập mốc thời gian hợp lệ',
        completed: parsedStart.valid,
        required: true,
        targetStepIndex: 0, // Bước 1: Tổng quan
      },
      {
        id: 'content',
        label: 'Nội dung & Diễn biến',
        description:
          contentBlocks || summary.trim() || description.trim()
            ? 'Đã có nội dung diễn biến'
            : 'Chưa nhập tóm tắt hoặc diễn biến chi tiết',
        completed: Boolean(contentBlocks || summary.trim() || description.trim()),
        required: true,
        targetStepIndex: 1, // Bước 2: Nội dung & Diễn biến
      },
      {
        id: 'sources_and_graph',
        label: 'Mạng lưới liên kết & Nguồn sử liệu',
        description:
          (periodId || topicId) &&
          selectedEntityIds.length > 0 &&
          sourceReferenceNote.trim()
            ? `Đã liên kết giai đoạn, ${selectedEntityIds.length} thực thể và nguồn sử liệu`
            : 'Nên bổ sung thời kỳ, nhân vật tham gia và nguồn sử liệu tham khảo.',
        completed: Boolean(
          (periodId || topicId) &&
            selectedEntityIds.length > 0 &&
            sourceReferenceNote.trim(),
        ),
        required: false,
        targetStepIndex: 2, // Bước 3: Mạng lưới liên kết
      },
    ],
    [
      title,
      parsedStart.valid,
      eventDateNote,
      autoDisplayText,
      summary,
      description,
      contentBlocks,
      periodId,
      topicId,
      selectedEntityIds,
      sourceReferenceNote,
    ],
  );

  const handleSave = async (action: 'DRAFT' | 'PUBLISH') => {
    if (!title.trim()) {
      alert('Vui lòng nhập Tên sự kiện lịch sử.');
      setActiveStepIndex(0);
      return;
    }

    if (!parsedStart.valid || parsedStart.signedYear === null) {
      alert(
        parsedStart.error ||
          `Vui lòng nhập Mốc bắt đầu hợp lệ theo định dạng DD/MM/YYYY hoặc YYYY (VD: ${SAMPLE_START_DATE} hoặc 1959).`,
      );
      setActiveStepIndex(0);
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
        setActiveStepIndex(0);
        return;
      }
      if (parsedEnd.signedYear < parsedStart.signedYear) {
        alert('Mốc kết thúc không được nhỏ hơn mốc bắt đầu sự kiện.');
        setActiveStepIndex(0);
        return;
      }
      signedEndYear = parsedEnd.signedYear;
      endMonthVal = parsedEnd.month;
      endDayVal = parsedEnd.day;
    }

    const finalDisplayNote = eventDateNote.trim() || autoDisplayText || undefined;
    const targetStatus =
      action === ContentStatus.DRAFT ? ContentStatus.DRAFT : status || ContentStatus.PUBLISHED;

    const extractedHtml = Array.isArray(contentBlocks)
      ? contentBlocks
          .map((b: any) => b?.data?.content || b?.content || '')
          .filter(Boolean)
          .join('\n')
      : '';

    const mergedMetadata: Record<string, any> = {
      ...metadata,
      ...(contentBlocks ? { contentBlocks } : {}),
      ...(sourceReferenceNote.trim() ? { sourceReferenceNote: sourceReferenceNote.trim() } : {}),
      ...(locationLabel.trim() ? { rawLocation: locationLabel.trim() } : {}),
    };

    const payload: SaveHistoricalEventPayload = {
      title: title.trim(),
      slug:
        isCustomSlugMode && customSlug.trim()
          ? customSlug.trim()
          : autoSlugPreview || undefined,
      startYear: parsedStart.signedYear,
      startMonth: parsedStart.month,
      startDay: parsedStart.day,
      endYear: signedEndYear || (timelineMode === TimelineMode.POINT && parsedStart.precision === DatePrecision.CENTURY ? parsedStart.approxEndYear || null : null),
      endMonth: endMonthVal,
      endDay: endDayVal,
      datePrecision:
        parsedStart.precision ||
        (timelineMode === TimelineMode.RANGE ? DatePrecision.RANGE : DatePrecision.YEAR),
      dateText: finalDisplayNote,
      eventDateNote: finalDisplayNote,
      summary: summary.trim() || undefined,
      description: description.trim() || extractedHtml || summary.trim() || undefined,
      periodId: periodId || undefined,
      topicId: topicId || undefined,
      locationId: locationId || undefined,
      parentId: parentId ? parentId : null,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      status: action === ContentAction.PUBLISH ? ContentStatus.PUBLISHED : targetStatus,
      categoryIds,
      metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      entityRelations: selectedEntityIds.map((entityId, idx) => {
        const value =
          entityRoles[entityId] ??
          emptyEventRole(entities.find((e) => e.id === entityId)?.type);
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
        const updated = await HistoricalEventApiService.updateEvent(eventId, payload);
        if (isRevisionPending(updated)) {
          setPendingRevision(updated.revision);
          setRevisionNotice(updated.message);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setStatus(updated.status || payload.status || ContentStatus.PUBLISHED);
        setUpdatedAt(updated.updatedAt || new Date().toISOString());
        if (action === ContentStatus.DRAFT) {
          setLastDraftSavedAt(new Date().toLocaleTimeString('vi-VN'));
        }
      } else {
        const created = await HistoricalEventApiService.createEvent(payload);
        if (action === ContentStatus.DRAFT) {
          setLastDraftSavedAt(new Date().toLocaleTimeString('vi-VN'));
          if (created?.id) {
            router.replace(`${APP_ROUTES.EVENTS.LIST}/${created.id}`);
            return;
          }
        }
      }
      if (action === ContentAction.PUBLISH) {
        router.push(APP_ROUTES.EVENTS.LIST);
      }
    } catch (err) {
      console.error('Failed to save historical event:', err);
      alert(extractErrorMessage(err, 'Không thể lưu thông tin Sự kiện lịch sử.'));
    } finally {
      setSavingAction(null);
    }
  };

  return {
    isEditMode,
    loadingInitial,
    savingAction,
    isPreviewOpen,
    setIsPreviewOpen,
    activeStepIndex,
    setActiveStepIndex,

    // Dữ liệu tham chiếu
    periods,
    topics,
    locations,
    entities,
    otherEvents,

    // Bước 1: Tổng quan
    title,
    setTitle,
    titleTouched,
    setTitleTouched,
    activeSlug,
    customSlug,
    setCustomSlug,
    isCustomSlugMode,
    setIsCustomSlugMode,
    categoryIds,
    setCategoryIds,
    categoryGroup,
    roleGroup,
    relationGroup,
    metadata,
    setMetadata,
    summary,
    setSummary,
    thumbnailUrl,
    setThumbnailUrl,
    timelineMode,
    setTimelineMode,
    startDateInput,
    setStartDateInput,
    startIsBce,
    setStartIsBce,
    parsedStart,
    endDateInput,
    setEndDateInput,
    endIsBce,
    setEndIsBce,
    parsedEnd,
    eventDateNote,
    setEventDateNote,
    isCustomDisplayMode,
    setIsCustomDisplayMode,
    locationId,
    setLocationId,
    locationLabel,
    setLocationLabel,
    handleSelectLocation,

    // Bước 2: Nội dung & Diễn biến (Studio Block Builder)
    description,
    setDescription,
    contentBlocks,
    setContentBlocks,
    mediaList,
    handleAddMedia,
    handleRemoveMedia,
    sourceReferenceNote,
    setSourceReferenceNote,

    // Bước 3: Mạng lưới liên kết
    parentId,
    periodId,
    topicId,
    selectedEntityIds,
    entityRoles,
    setEntityRoles,
    eventRelations,
    incomingEventRelations,
    availableKnowledgeItems,
    linkedKnowledgeItems,
    handleAddKnowledgeItems,
    handleRemoveKnowledgeItem,
    handleAddEventRelation,
    handleRemoveEventRelation,

    // Bước 4: Kiểm duyệt & Xuất bản
    status,
    setStatus,
    createdAt,
    updatedAt,
    lastDraftSavedAt,
    pendingRevision,
    revisionNotice,
    setRevisionNotice,
    loadReferenceDataAndDetail,
    handleFillSampleData,
    reviewChecklist,
    handleSave,
  };
}
