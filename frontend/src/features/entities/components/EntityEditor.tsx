'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  EntityDetailLayout,
  DataCompletenessItem,
  FormSectionConfig,
} from '@/components/common/EntityDetailLayout';
import { LessonMediaItem } from '@/features/lessons/types/editor.types';
import { IconName } from '@/constants/icons';
import { ContentStatus, EntityRelationType, EntityType, ENTITY_RELATION_TYPE_LABELS, MediaType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import {
  HistoricalEntityApiService,
  SaveHistoricalEntityPayload,
} from '@/services/entities/historical-entity.service';
import { PeriodApiService } from '@/services/entities/period.service';
import { TaxonomyApiService, type TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { relationLabel as taxonomyRelationLabel } from '@/features/taxonomy/taxonomy-labels';

const SITE_TAXONOMY_GROUPS = ['SITE_TYPE', 'PRESERVATION', 'HERITAGE_RANK', 'ENTITY_RELATION'];
import { PeriodItem } from '@/types/models/period.type';
import { extractErrorMessage } from '@/services/api';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import {
  EMPTY_FIGURE_PROFILE,
  FIGURE_PROFILE_METADATA_KEY,
  type FigureProfileForm,
  figureProfileFromEntity,
  figureProfileToMetadata,
} from './FigureProfileFields';
import {
  HistoricalEventApiService,
  HistoricalEventItem,
} from '@/services/entities/historical-event.service';
import {
  KnowledgeRelationItem,
  KnowledgeRelationType,
} from '@/components/common/KnowledgeRelationManager';
import { ENTITY_TYPE_LABELS, getTimeLabels, type RelationDraft } from './entity-editor.constants';
import { EntityStrategyRegistry } from '../strategies/entity-type.strategy';
import { EntityBasicInfoStep } from './steps/EntityBasicInfoStep';
import { EntityContentStep } from './steps/EntityContentStep';
import { EntityRelationsStep } from './steps/EntityRelationsStep';
import { EntityPublishStep } from './steps/EntityPublishStep';

export interface EntityEditorProps {
  entityId?: string;
  defaultType?: EntityType;
  returnRoute?: string;
}

export function EntityEditor({
  entityId,
  defaultType,
  returnRoute,
}: EntityEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(entityId);
  const targetReturnRoute = returnRoute || APP_ROUTES.ENTITIES.LIST;

  // Đọc query param `type` từ URL nếu có (ví dụ: /entities/create?type=PERSON)
  const queryType = useMemo(() => {
    const raw = searchParams?.get('type')?.toUpperCase();
    if (!raw) return undefined;
    return (Object.values(EntityType) as string[]).includes(raw)
      ? (raw as EntityType)
      : undefined;
  }, [searchParams]);

  const resolvedInitialType = defaultType ?? queryType ?? EntityType.PERSON;

  const isLocationMode =
    resolvedInitialType === EntityType.LOCATION ||
    returnRoute === APP_ROUTES.LOCATIONS.LIST;
  const isFigureMode =
    resolvedInitialType === EntityType.PERSON ||
    returnRoute === APP_ROUTES.FIGURES.LIST;
  // Vào form từ 1 lối tạo đã biết trước loại (vd. /locations/create hoặc ?type=PERSON) thì khoá hẳn ô "Phân
  // loại thực thể" — không hỏi lại cái người dùng vừa chọn. Chỉ còn hỏi khi vào từ lối tạo
  // chung /entities/create (chưa biết trước là Nhân vật/Triều đại/Tổ chức/...).
  const isTypeLocked = (Boolean(defaultType) || Boolean(queryType)) && !isEdit;

  // Core Entity State
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>(resolvedInitialType);
  const strategy = useMemo(() => EntityStrategyRegistry.get(type), [type]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const timeLabels = useMemo(() => getTimeLabels(type), [type]);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [contentBlocks, setContentBlocks] = useState<unknown>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [periodId, setPeriodId] = useState<string>('');
  const [periodIds, setPeriodIds] = useState<string[]>([]);
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [deathYear, setDeathYear] = useState<number | ''>('');
  const [birthDateLabel, setBirthDateLabel] = useState('');
  const [deathDateLabel, setDeathDateLabel] = useState('');
  // Historical Site fields (cho LOCATION)
  const [siteType, setSiteType] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [constructionYear, setConstructionYear] = useState<number | ''>('');
  const [constructionLabel, setConstructionLabel] = useState<string>('');
  const [preservationStatus, setPreservationStatus] = useState<string>('');
  const [recognitionLevel, setRecognitionLevel] = useState<string>('');
  const [managingAgency, setManagingAgency] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  // Loại / hiện trạng / xếp hạng lấy từ "Danh mục dùng chung" thay cho ô chữ tự do.
  const [siteTaxonomies, setSiteTaxonomies] = useState<Record<string, TaxonomyGroupItem>>({});
  // Loại quan hệ giữa thực thể theo danh mục ENTITY_RELATION (có nhãn chiều ngược).
  const relationTerms = siteTaxonomies.ENTITY_RELATION?.terms ?? [];

  const [figureProfile, setFigureProfile] = useState<FigureProfileForm>(EMPTY_FIGURE_PROFILE);
  // metadata.profile gốc (có thể còn backgroundAndYouth/anecdotes/legacyAndHonors từ dữ liệu cũ/seed
  // — form này không còn cho sửa 3 trường đó, nhưng không được xoá mất khi lưu).
  const [originalFigureProfile, setOriginalFigureProfile] = useState<Record<string, unknown> | undefined>(undefined);

  const [metadataJsonText, setMetadataJsonText] = useState('{}');
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  // Phiên bản hóa: bản sửa chờ duyệt đang mở, thông báo sau khi lưu, khóa tải lại sau duyệt / khôi phục.
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Relations & Media State
  const [relations, setRelations] = useState<RelationDraft[]>([]);
  const [incomingRelations, setIncomingRelations] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<LessonMediaItem[]>([]);

  // Reference Options State
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [allEntities, setAllEntities] = useState<HistoricalEntityItem[]>([]);
  const [allEvents, setAllEvents] = useState<HistoricalEventItem[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<
    Array<{
      eventId: string;
      title: string;
      role: string;
      roleLabel?: string | null;
      isPrimary?: boolean;
      startYear?: number | null;
    }>
  >([]);
  const [loading, setLoading] = useState(isEdit);
  const [savingAction, setSavingAction] = useState<'DRAFT' | 'PUBLISH' | null>(null);

  // Fetch Master Data: Periods, Entities & Events
  useEffect(() => {
    Promise.all([
      PeriodApiService.getPeriods().catch(() => ({ items: [] })),
      HistoricalEntityApiService.getEntities({ limit: 100 }).catch(() => ({
        items: [],
      })),
      HistoricalEventApiService.getEvents({ limit: 100 }).catch(() => ({
        items: [],
      })),
    ]).then(([periodRes, entityRes, eventRes]) => {
      setPeriods(periodRes.items || []);
      setAllEntities(entityRes.items || []);
      setAllEvents(eventRes.items || []);
    });
    TaxonomyApiService.getGroups(SITE_TAXONOMY_GROUPS)
      .then((groups) => setSiteTaxonomies(Object.fromEntries(groups.map((g) => [g.code, g]))))
      .catch(() => setSiteTaxonomies({}));
  }, []);

  // Fetch Existing Entity (If Edit Mode)
  useEffect(() => {
    if (!entityId) return;

    setLoading(true);
    HistoricalEntityApiService.getEntityById(entityId)
      // Đang xuất bản mà có bản sửa chờ duyệt → mở bản sửa đó để sửa tiếp không mất phần trước.
      .then((fetched) => withPendingDraft('ENTITY', entityId, fetched))
      .then(({ detail: data, pending }) => {
        setPendingRevision(pending);
        setName(data.name || '');
        setType(data.type || EntityType.PERSON);
        setTagline(data.tagline || '');
        setDescription(data.description || '');
        setContentBlocks(data.contentBlocks ?? null);
        setAliases(data.aliases || []);
        setImageUrl(data.imageUrl || '');
        setImageCaption(data.imageCaption || '');
        setPeriodId(data.periodId || '');
        const loadedPeriodIds = Array.isArray(data.periodIds) && data.periodIds.length > 0
          ? data.periodIds
          : data.periodId
          ? [data.periodId]
          : [];
        setPeriodIds(loadedPeriodIds);
        // Nhân vật: năm sinh – mất · loại khác (triều đại / quốc gia, tổ chức...): năm tồn tại.
        setBirthYear(data.birthYear ?? data.startYear ?? '');
        setDeathYear(data.deathYear ?? data.endYear ?? '');
        setBirthDateLabel(data.birthDateLabel || '');
        setDeathDateLabel(data.deathDateLabel || '');
        setSiteType(data.siteTypeCode || data.siteType || 'MONUMENT');
        setAddress(data.address || '');
        setLatitude(data.latitude ?? '');
        setLongitude(data.longitude ?? '');
        setConstructionYear(data.constructionYear ?? '');
        setConstructionLabel(data.constructionLabel || '');
        setPreservationStatus(data.preservationCode || data.preservationStatus || '');
        setRecognitionLevel(data.rankCode || data.recognitionLevel || '');
        setManagingAgency(data.managingAgency || '');
        setStatusNote(data.statusNote || '');
        setFigureProfile(figureProfileFromEntity(data));
        // metadata.profile is edited through the "Hồ sơ nhân vật" form, so keep it out of the raw JSON box.
        const { [FIGURE_PROFILE_METADATA_KEY]: _profile, ...otherMetadata } = data.metadata ?? {};
        setOriginalFigureProfile(_profile as Record<string, unknown> | undefined);
        setMetadataJsonText(
          Object.keys(otherMetadata).length > 0 ? JSON.stringify(otherMetadata, null, 2) : '{}',
        );
        setIsFeatured(Boolean(data.isFeatured));
        setDisplayOrder(data.displayOrder ?? 0);
        setStatus(data.status || ContentStatus.DRAFT);

        // Map outgoing relations
        if (data.outgoingRelations) {
          setRelations(
            data.outgoingRelations.map((r) => ({
              id: r.id,
              targetEntityId: r.targetEntityId,
              relationType: r.relationType as EntityRelationType,
              startYear: r.startYear ?? '',
              endYear: r.endYear ?? '',
              note: r.note || '',
            })),
          );
        }
        if (data.incomingRelations) {
          setIncomingRelations(data.incomingRelations);
        }

        // Map linked events (eventEntities & primaryEvents)
        const eventList: Array<{
          eventId: string;
          title: string;
          role: string;
          roleLabel?: string | null;
          isPrimary?: boolean;
          startYear?: number | null;
        }> = [];

        if (Array.isArray(data.eventEntities)) {
          data.eventEntities.forEach((ee) => {
            if (ee.event) {
              eventList.push({
                eventId: ee.eventId,
                title: ee.event.title,
                role: ee.role,
                roleLabel: ee.roleLabel,
                isPrimary: ee.isPrimary,
                startYear: ee.event.startYear,
              });
            }
          });
        }

        if (Array.isArray(data.primaryEvents)) {
          data.primaryEvents.forEach((pe) => {
            if (!eventList.some((e) => e.eventId === pe.id)) {
              eventList.push({
                eventId: pe.id,
                title: pe.title,
                role: 'PRIMARY_LOCATION',
                roleLabel: 'Địa điểm diễn ra chính',
                isPrimary: true,
                startYear: pe.startYear,
              });
            }
          });
        }

        setLinkedEvents(eventList);

        // Map media
        if (data.media) {
          setMediaList(
            data.media.map((m) => ({
              id: m.id,
              type: m.type as MediaType,
              url: m.url,
              caption: m.caption || '',
              displayOrder: m.displayOrder ?? 0,
            })),
          );
        }
      })
      .catch((err) => {
        console.error('Failed to load historical entity detail:', err);
        alert(extractErrorMessage(err, 'Không thể tải thông tin thực thể lịch sử.'));
        router.push(APP_ROUTES.ENTITIES.LIST);
      })
      .finally(() => setLoading(false));
  }, [entityId, router, reloadKey]);

  // Aliases Handling
  const handleAddAlias = () => {
    const trimmed = aliasInput.trim();
    if (!trimmed) return;
    if (!aliases.includes(trimmed)) {
      setAliases([...aliases, trimmed]);
    }
    setAliasInput('');
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setAliases(aliases.filter((a) => a !== aliasToRemove));
  };

  // Relations Handling
  const handleRemoveRelation = (index: number) => {
    setRelations(relations.filter((_, idx) => idx !== index));
  };

  const handleUpdateRelation = (index: number, patch: Partial<RelationDraft>) => {
    setRelations((prev) => prev.map((r, idx) => (idx === index ? { ...r, ...patch } : r)));
  };

  // Media Handling
  const handleAddMedia = (item: LessonMediaItem) => {
    setMediaList([...mediaList, item]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList(mediaList.filter((_, idx) => idx !== index));
  };

  // Year Range Validation Check
  const yearValidationError = useMemo(() => {
    if (
      birthYear !== '' &&
      deathYear !== '' &&
      Number(deathYear) < Number(birthYear)
    ) {
      return 'Năm mất/kết thúc phải lớn hơn hoặc bằng năm sinh/thành lập.';
    }
    return null;
  }, [birthYear, deathYear]);

  // Data Completeness Calculation
  const completenessItems: DataCompletenessItem[] = useMemo(() => {
    return [
      {
        label: 'Tên thực thể lịch sử',
        description: 'Tên chính thức hoặc thường gọi nhất',
        completed: Boolean(name.trim()),
        required: true,
      },
      {
        label: 'Chủng loại thực thể',
        description: 'Nhân vật, Triều đại, Tổ chức, Quân sự hay Hiện vật',
        completed: Boolean(type),
        required: true,
      },
      {
        label: 'Mô tả / Hồ sơ chi tiết',
        description: 'Soạn thảo nội dung lịch sử bằng TipTap',
        completed: Boolean(description && description.trim().length > 20),
        required: true,
      },
      {
        label: 'Niên đại hoạt động',
        description: 'Năm sinh/thành lập hoặc năm mất/giải thể',
        completed: birthYear !== '' || deathYear !== '',
        required: false,
      },
      {
        label: 'Thời kỳ lịch sử',
        description: 'Gắn với thời kỳ / giai đoạn lịch sử',
        completed: Boolean(periodId),
        required: false,
      },
      {
        label: 'Hình ảnh chân dung / tư liệu',
        description: 'Ảnh đại diện và chú thích ảnh',
        completed: Boolean(imageUrl),
        required: false,
      },
      {
        label: 'Liên kết thực thể & bối cảnh',
        description: 'Liên kết thực thể với sự kiện, nhân vật, địa điểm hoặc thời kỳ',
        completed: relations.length > 0 || linkedEvents.length > 0,
        required: false,
      },
    ];
  }, [name, type, description, birthYear, deathYear, periodId, imageUrl, relations, linkedEvents]);

  // Hợp nhất toàn bộ kho tri thức để hiển thị trong Modal "Thêm liên kết tri thức"
  const availableKnowledgeItems: KnowledgeRelationItem[] = useMemo(() => {
    const items: KnowledgeRelationItem[] = [];

    // 1. Sự kiện lịch sử (EVENT)
    allEvents.forEach((ev) => {
      items.push({
        id: `event:${ev.id}`,
        rawId: ev.id,
        name: ev.title,
        type: KnowledgeRelationType.EVENT,
        typeLabel: 'Sự kiện',
        subtitle: ev.eventDateNote || 'Sự kiện lịch sử',
        yearLabel: ev.startYear ? `${ev.startYear}` : undefined,
      });
    });

    // Thời kỳ lịch sử: KHÔNG đưa vào đây nữa — chọn qua dãy Chip ở Mục 1 (Thời kỳ & Niên
    // đại hoạt động), tránh 2 chỗ cùng sửa 1 state (periodId/periodIds) gây lú cho người nhập.

    // 2. Thực thể khác (Nhân vật, Địa điểm, Lực lượng, Hiện vật)
    allEntities
      .filter((e) => e.id !== entityId)
      .forEach((ent) => {
        let relType = KnowledgeRelationType.PERSON;
        let typeLabel = 'Nhân vật';
        if (ent.type === EntityType.LOCATION) {
          relType = KnowledgeRelationType.LOCATION;
          typeLabel = 'Địa điểm';
        } else if (
          ent.type === EntityType.MILITARY_FORCE ||
          ent.type === EntityType.ORGANIZATION ||
          ent.type === EntityType.DYNASTY
        ) {
          relType = KnowledgeRelationType.FORCE;
          typeLabel = 'Lực lượng / Tổ chức';
        } else if (ent.type === EntityType.ARTIFACT) {
          relType = KnowledgeRelationType.ARTIFACT;
          typeLabel = 'Hiện vật';
        }

        items.push({
          id: `entity:${ent.id}`,
          rawId: ent.id,
          name: ent.name,
          type: relType,
          typeLabel,
          subtitle: ent.tagline || ent.address || (relType === KnowledgeRelationType.PERSON ? 'Nhân vật lịch sử' : undefined),
        });
      });

    return items;
  }, [allEvents, allEntities, entityId]);

  // Các thực thể & sự kiện đang liên kết với thực thể hiện tại (Thời kỳ không hiện ở đây
  // nữa — xem ở dãy Chip Mục 1).
  const linkedKnowledgeItems: KnowledgeRelationItem[] = useMemo(() => {
    const list: KnowledgeRelationItem[] = [];

    // Sự kiện lịch sử tham gia hoặc là địa danh diễn ra
    linkedEvents.forEach((ev) => {
      list.push({
        id: `event:${ev.eventId}`,
        rawId: ev.eventId,
        name: ev.title,
        type: KnowledgeRelationType.EVENT,
        typeLabel: 'Sự kiện',
        relationLabel: ev.roleLabel || (ev.isPrimary ? 'Địa điểm / Thực thể chính' : 'Tham gia sự kiện'),
        subtitle: ev.role ? `Vai trò: ${ev.role}` : 'Sự kiện lịch sử',
        yearLabel: ev.startYear ? `${ev.startYear}` : undefined,
      });
    });

    // Các thực thể liên kết (outgoing relations)
    relations.forEach((rel) => {
      const ent = allEntities.find((e) => e.id === rel.targetEntityId);
      if (ent) {
        let relType = KnowledgeRelationType.PERSON;
        let typeLabel = 'Nhân vật';
        if (ent.type === EntityType.LOCATION) {
          relType = KnowledgeRelationType.LOCATION;
          typeLabel = 'Địa điểm';
        } else if (
          ent.type === EntityType.MILITARY_FORCE ||
          ent.type === EntityType.ORGANIZATION ||
          ent.type === EntityType.DYNASTY
        ) {
          relType = KnowledgeRelationType.FORCE;
          typeLabel = 'Lực lượng / Tổ chức';
        } else if (ent.type === EntityType.ARTIFACT) {
          relType = KnowledgeRelationType.ARTIFACT;
          typeLabel = 'Hiện vật';
        }

        const relationLabel = taxonomyRelationLabel(relationTerms, rel.relationType, 'OUTGOING', ENTITY_RELATION_TYPE_LABELS);

        list.push({
          id: `entity:${ent.id}`,
          rawId: ent.id,
          name: ent.name,
          type: relType,
          typeLabel,
          relationLabel,
          subtitle: rel.note || ent.tagline || 'Đã liên kết',
          yearLabel: rel.startYear ? `${rel.startYear} - ${rel.endYear || 'nay'}` : undefined,
        });
      }
    });

    return list;
  }, [linkedEvents, relations, allEntities]);

  const handleAddKnowledgeItems = (itemsToAdd: KnowledgeRelationItem[]) => {
    const newRelationsToAdd: RelationDraft[] = [];

    itemsToAdd.forEach((item) => {
      if (item.type === KnowledgeRelationType.EVENT) {
        // Thêm vào danh sách sự kiện tham gia
        if (!linkedEvents.some((e) => e.eventId === item.rawId)) {
          const evData = allEvents.find((e) => e.id === item.rawId);
          setLinkedEvents((prev) => [
            ...prev,
            {
              eventId: item.rawId,
              title: item.name,
              role: type === EntityType.LOCATION ? 'LOCATION' : 'PARTICIPANT',
              roleLabel: type === EntityType.LOCATION ? 'Địa danh diễn ra sự kiện' : 'Thực thể tham gia',
              isPrimary: type === EntityType.LOCATION,
              startYear: evData?.startYear,
            },
          ]);
        }
      } else {
        // PERSON, LOCATION, FORCE, ARTIFACT -> quan hệ thực thể
        if (!relations.some((r) => r.targetEntityId === item.rawId)) {
          let defaultRelType = EntityRelationType.ALLIED_WITH;
          if (type === EntityType.PERSON && item.type === KnowledgeRelationType.LOCATION) {
            defaultRelType = EntityRelationType.LOCATED_IN;
          } else if (type === EntityType.PERSON && item.type === KnowledgeRelationType.FORCE) {
            defaultRelType = EntityRelationType.MEMBER_OF;
          }
          newRelationsToAdd.push({
            targetEntityId: item.rawId,
            relationType: defaultRelType,
          });
        }
      }
    });

    if (newRelationsToAdd.length > 0) {
      setRelations((prev) => [...prev, ...newRelationsToAdd]);
    }
  };

  const handleRemoveKnowledgeItem = (id: string) => {
    if (id.startsWith('event:')) {
      const raw = id.replace('event:', '');
      setLinkedEvents((prev) => prev.filter((e) => e.eventId !== raw));
    } else if (id.startsWith('entity:')) {
      const raw = id.replace('entity:', '');
      setRelations((prev) => prev.filter((r) => r.targetEntityId !== raw));
    }
  };

  // Save Handler
  const handleSave = async (targetStatus: ContentStatus) => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên thực thể lịch sử.');
      return;
    }
    if (yearValidationError) {
      alert(yearValidationError);
      return;
    }

    let parsedMetadata: Record<string, any> = {};
    try {
      if (metadataJsonText.trim()) {
        parsedMetadata = JSON.parse(metadataJsonText);
      }
    } catch {
      alert('Dữ liệu JSON mở rộng (metadata) không đúng định dạng JSON.');
      return;
    }

    const isPerson = type === EntityType.PERSON;
    delete parsedMetadata[FIGURE_PROFILE_METADATA_KEY];
    const profileMetadata = isPerson ? figureProfileToMetadata(figureProfile, originalFigureProfile) : undefined;
    if (profileMetadata) parsedMetadata[FIGURE_PROFILE_METADATA_KEY] = profileMetadata;

    setSavingAction(targetStatus === ContentStatus.PUBLISHED ? 'PUBLISH' : 'DRAFT');

    const payload: SaveHistoricalEntityPayload = {
      name: name.trim(),
      type,
      tagline: tagline.trim() || undefined,
      description: description.trim() || undefined,
      aliases: aliases.length > 0 ? aliases : [],
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      periodId: periodId || (periodIds.length > 0 ? periodIds[0] : null),
      periodIds: periodIds.length > 0 ? periodIds : undefined,
      birthYear: isPerson && birthYear !== '' ? Number(birthYear) : undefined,
      deathYear: isPerson && deathYear !== '' ? Number(deathYear) : undefined,
      // Loại khác nhân vật / địa danh lưu năm tồn tại trên chính thực thể.
      startYear: !isPerson && type !== EntityType.LOCATION && birthYear !== '' ? Number(birthYear) : undefined,
      endYear: !isPerson && type !== EntityType.LOCATION && deathYear !== '' ? Number(deathYear) : undefined,
      birthDateLabel: birthDateLabel.trim() || undefined,
      deathDateLabel: deathDateLabel.trim() || undefined,
      roles: isPerson ? figureProfile.roles : undefined,
      contentBlocks: contentBlocks ?? undefined,
      // Historical Site fields (cho LOCATION)
      siteType: type === EntityType.LOCATION ? (siteType.trim() || 'MONUMENT') : undefined,
      address: type === EntityType.LOCATION ? (address.trim() || undefined) : undefined,
      latitude: type === EntityType.LOCATION && latitude !== '' ? Number(latitude) : undefined,
      longitude: type === EntityType.LOCATION && longitude !== '' ? Number(longitude) : undefined,
      constructionYear: type === EntityType.LOCATION && constructionYear !== '' ? Number(constructionYear) : undefined,
      constructionLabel: type === EntityType.LOCATION ? (constructionLabel.trim() || undefined) : undefined,
      preservationStatus: type === EntityType.LOCATION ? preservationStatus.trim() : undefined,
      recognitionLevel: type === EntityType.LOCATION ? recognitionLevel.trim() : undefined,
      managingAgency: type === EntityType.LOCATION ? (managingAgency.trim() || undefined) : undefined,
      statusNote: type === EntityType.LOCATION ? statusNote.trim() : undefined,
      // Always sent so that clearing the profile fields actually removes them on update.
      metadata: parsedMetadata,
      isFeatured,
      displayOrder: Number(displayOrder) || 0,
      status: targetStatus,
    };

    try {
      let savedEntityId = entityId;
      if (isEdit && entityId) {
        const updated = await HistoricalEntityApiService.updateEntity(entityId, payload);
        if (isRevisionPending(updated)) {
          // Nội dung đang xuất bản: thay đổi thành bản sửa chờ duyệt, bản công khai giữ nguyên.
          setPendingRevision(updated.revision);
          setRevisionNotice(updated.message);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } else {
        const created = await HistoricalEntityApiService.createEntity(payload);
        savedEntityId = created.id;
      }

      // Sync relations if saved successfully
      if (savedEntityId) {
        for (const rel of relations) {
          if (!rel.id) {
            await HistoricalEntityApiService.addRelation(savedEntityId, {
              targetEntityId: rel.targetEntityId,
              relationType: rel.relationType,
              startYear: rel.startYear !== '' ? Number(rel.startYear) : undefined,
              endYear: rel.endYear !== '' ? Number(rel.endYear) : undefined,
              note: rel.note,
            }).catch((err) =>
              console.warn('Failed to add relation:', rel, err),
            );
          }
        }

        // Sync media items
        for (const med of mediaList) {
          if (!med.id) {
            await HistoricalEntityApiService.addMedia(savedEntityId, {
              type: med.type,
              url: med.url,
              caption: med.caption,
              displayOrder: med.displayOrder,
            }).catch((err) =>
              console.warn('Failed to add media:', med, err),
            );
          }
        }
      }

      router.push(targetReturnRoute);
    } catch (err) {
      console.error('Failed to save entity:', err);
      alert(extractErrorMessage(err, 'Lưu thực thể lịch sử thất bại.'));
    } finally {
      setSavingAction(null);
    }
  };

  // Form Sections Config (4 Tab tinh gọn sử dụng Strategy Pattern)
  const sections: FormSectionConfig[] = [
    {
      id: 'general-info',
      stepNumber: 1,
      title: strategy.getSectionConfig(1).title,
      subtitle: strategy.getSectionConfig(1).subtitle,
      icon: IconName.TAG,
      content: (
        <EntityBasicInfoStep
          name={name}
          onNameChange={setName}
          type={type}
          onTypeChange={setType}
          isTypeLocked={isTypeLocked}
          tagline={tagline}
          onTaglineChange={setTagline}
          aliases={aliases}
          aliasInput={aliasInput}
          onAliasInputChange={setAliasInput}
          onAddAlias={handleAddAlias}
          onRemoveAlias={handleRemoveAlias}
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          imageCaption={imageCaption}
          onImageCaptionChange={setImageCaption}
          siteTaxonomies={siteTaxonomies}
          address={address}
          onAddressChange={setAddress}
          siteType={siteType}
          onSiteTypeChange={setSiteType}
          latitude={latitude}
          onLatitudeChange={setLatitude}
          longitude={longitude}
          onLongitudeChange={setLongitude}
          recognitionLevel={recognitionLevel}
          onRecognitionLevelChange={setRecognitionLevel}
          preservationStatus={preservationStatus}
          onPreservationStatusChange={setPreservationStatus}
          managingAgency={managingAgency}
          onManagingAgencyChange={setManagingAgency}
          statusNote={statusNote}
          onStatusNoteChange={setStatusNote}
          periods={periods}
          periodIds={periodIds}
          onPeriodIdsChange={setPeriodIds}
          periodId={periodId}
          onPeriodIdChange={setPeriodId}
          birthYear={birthYear}
          onBirthYearChange={setBirthYear}
          deathYear={deathYear}
          onDeathYearChange={setDeathYear}
          birthDateLabel={birthDateLabel}
          onBirthDateLabelChange={setBirthDateLabel}
          deathDateLabel={deathDateLabel}
          onDeathDateLabelChange={setDeathDateLabel}
          yearValidationError={yearValidationError}
          figureProfile={figureProfile}
          onFigureProfileChange={setFigureProfile}
        />
      ),
    },
    {
      id: 'content-detail',
      stepNumber: 2,
      title: strategy.getSectionConfig(2).title,
      subtitle: strategy.getSectionConfig(2).subtitle,
      icon: IconName.BOOK,
      content: (
        <EntityContentStep
          type={type}
          name={name}
          tagline={tagline}
          birthYear={birthYear}
          deathYear={deathYear}
          contentBlocks={contentBlocks}
          onContentBlocksChange={setContentBlocks}
          description={description}
          onDescriptionChange={setDescription}
          figureProfile={figureProfile}
          onFigureProfileChange={setFigureProfile}
          onPublish={() => handleSave(ContentStatus.PUBLISHED)}
        />
      ),
    },
    {
      id: 'related-entities',
      stepNumber: 3,
      title: strategy.getSectionConfig(3).title,
      subtitle: strategy.getSectionConfig(3).subtitle,
      icon: IconName.USERS,
      badgeCount: relations.length + incomingRelations.length + linkedEvents.length,
      content: (
        <EntityRelationsStep
          type={type}
          availableKnowledgeItems={availableKnowledgeItems}
          linkedKnowledgeItems={linkedKnowledgeItems}
          onAddKnowledgeItems={handleAddKnowledgeItems}
          onRemoveKnowledgeItem={handleRemoveKnowledgeItem}
          relations={relations}
          relationTerms={relationTerms}
          allEntities={allEntities}
          onUpdateRelation={handleUpdateRelation}
          onRemoveRelation={handleRemoveRelation}
          incomingRelations={incomingRelations}
        />
      ),
    },
    {
      id: 'media-and-publish',
      stepNumber: 4,
      title: strategy.getSectionConfig(4).title,
      subtitle: strategy.getSectionConfig(4).subtitle,
      icon: IconName.CHECK,
      content: (
        <EntityPublishStep
          name={name}
          type={type}
          tagline={tagline}
          imageUrl={imageUrl}
          periodName={periods.find((p) => p.id === periodId)?.name}
          birthYear={birthYear}
          deathYear={deathYear}
          isFeatured={isFeatured}
          onIsFeaturedChange={setIsFeatured}
          displayOrder={displayOrder}
          onDisplayOrderChange={setDisplayOrder}
          timelineNodesCount={
            Array.isArray(contentBlocks)
              ? contentBlocks.reduce((acc: number, b: any) => {
                  if (b?.type === 'TIMELINE' && Array.isArray(b?.nodes)) {
                    return acc + b.nodes.length;
                  }
                  return acc;
                }, 0)
              : 0
          }
          relationsCount={relations.length + linkedEvents.length}
          status={status}
          onNavigateToStep={(s) => setActiveSectionIndex(s - 1)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        Đang tải thông tin thực thể lịch sử...
      </div>
    );
  }

  const breadcrumbs = isLocationMode
    ? [
        { label: 'Bảng điều khiển', href: APP_ROUTES.DASHBOARD },
        { label: 'Địa danh & Di tích', href: APP_ROUTES.LOCATIONS.LIST },
        {
          label: isEdit
            ? `Chỉnh sửa: ${name || 'Địa danh'}`
            : 'Tạo mới địa danh / di tích',
        },
      ]
    : isFigureMode
    ? [
        { label: 'CMS', href: APP_ROUTES.DASHBOARD },
        { label: 'Từ điển tri thức', href: APP_ROUTES.KNOWLEDGE },
        { label: 'Nhân vật lịch sử', href: APP_ROUTES.FIGURES.LIST },
        {
          label: isEdit
            ? `Chỉnh sửa: ${name || 'Nhân vật'}`
            : 'Tạo mới nhân vật lịch sử',
        },
      ]
    : [
        { label: 'Bảng điều khiển', href: APP_ROUTES.DASHBOARD },
        { label: 'Thực thể lịch sử', href: APP_ROUTES.ENTITIES.LIST },
        {
          label: isEdit
            ? `Chỉnh sửa: ${name || 'Thực thể'}`
            : isTypeLocked
            ? `Tạo mới ${ENTITY_TYPE_LABELS[type]}`
            : 'Tạo mới thực thể lịch sử',
        },
      ];

  const pageTitle = isLocationMode
    ? isEdit
      ? name || 'Chỉnh sửa địa danh / di tích'
      : 'Tạo mới địa danh / di tích lịch sử'
    : isFigureMode
    ? isEdit
      ? name || 'Chỉnh sửa nhân vật'
      : 'Tạo mới nhân vật lịch sử'
    : isEdit
    ? name || 'Chỉnh sửa thực thể'
    : isTypeLocked
    ? `Tạo mới ${ENTITY_TYPE_LABELS[type]}`
    : 'Tạo mới thực thể lịch sử';

  const pageSubtitle = isLocationMode
    ? 'Quản lý thông tin địa danh, di tích lịch sử, tọa độ địa lý, hiện trạng bảo tồn và sự kiện liên quan.'
    : isFigureMode
    ? 'Quản lý hồ sơ nhân vật, danh nhân, tiểu sử, công trạng và mạng lưới liên hệ tri thức.'
    : 'Quản lý thông tin nhân vật, triều đại, tổ chức, hiện vật và mạng lưới liên hệ tri thức.';

  return (
    <EntityDetailLayout
      breadcrumbs={breadcrumbs}
      title={pageTitle}
      subtitle={pageSubtitle}
      recordId={entityId}
      status={status}
      savingAction={savingAction}
      onSaveDraft={() => handleSave(ContentStatus.DRAFT)}
      onPublish={() => handleSave(ContentStatus.PUBLISHED)}
      onCancel={() => router.push(targetReturnRoute)}
      sections={sections}
      navigationLayout="HORIZONTAL_STEPPER"
      activeSectionIndex={activeSectionIndex}
      onActiveSectionIndexChange={setActiveSectionIndex}
      banner={
        <EditorRevisionBanner
          type="ENTITY"
          contentId={entityId}
          status={status}
          pending={pendingRevision}
          notice={revisionNotice}
          onChanged={(message) => {
            setRevisionNotice(message);
            setReloadKey((k) => k + 1);
          }}
        />
      }
    />
  );
}
