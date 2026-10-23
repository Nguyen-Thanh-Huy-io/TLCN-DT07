'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  EntityDetailLayout,
  DataCompletenessItem,
  FormSectionConfig,
} from '@/components/common/EntityDetailLayout';
import { TipTapContent } from '@/features/lessons/components/TipTapContent';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import { LessonMediaManager } from '@/features/lessons/components/LessonMediaManager';
import { LessonMediaItem } from '@/features/lessons/types/editor.types';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import {
  ContentStatus,
  EntityRelationType,
  EntityType,
  ENTITY_RELATION_TYPE_LABELS,
  MediaType,
} from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import {
  HistoricalEntityApiService,
  SaveHistoricalEntityPayload,
} from '@/services/entities/historical-entity.service';
import { PeriodApiService } from '@/services/entities/period.service';
import { TaxonomyApiService, type TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { TaxonomySelect } from '@/features/taxonomy/TaxonomySelect';
import { relationLabel as taxonomyRelationLabel, relationOptions } from '@/features/taxonomy/taxonomy-labels';

const SITE_TAXONOMY_GROUPS = ['SITE_TYPE', 'PRESERVATION', 'HERITAGE_RANK', 'ENTITY_RELATION'];
import { PeriodItem } from '@/types/models/period.type';
import { extractErrorMessage } from '@/services/api';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import {
  EMPTY_FIGURE_PROFILE,
  FIGURE_PROFILE_METADATA_KEY,
  FigureProfileFields,
  type FigureProfileForm,
  figureProfileFromEntity,
  figureProfileToMetadata,
} from './FigureProfileFields';
import {
  HistoricalEventApiService,
  HistoricalEventItem,
} from '@/services/entities/historical-event.service';
import {
  KnowledgeRelationManager,
  KnowledgeRelationItem,
  KnowledgeRelationType,
} from '@/components/common/KnowledgeRelationManager';

export interface EntityEditorProps {
  entityId?: string;
  defaultType?: EntityType;
  returnRoute?: string;
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.PERSON]: 'Nhân vật lịch sử',
  [EntityType.DYNASTY]: 'Triều đại / Vương triều / Đế chế',
  [EntityType.ORGANIZATION]: 'Tổ chức / Đảng phái / Liên minh',
  [EntityType.MILITARY_FORCE]: 'Lực lượng quân sự / Binh đoàn',
  [EntityType.ARTIFACT]: 'Hiện vật / Bảo vật quốc gia',
  [EntityType.LOCATION]: 'Địa danh / Di tích lịch sử',
  [EntityType.OTHER]: 'Khác',
};

interface RelationDraft {
  id?: string;
  targetEntityId: string;
  relationType: string;
  startYear?: number | '';
  endYear?: number | '';
  note?: string;
}

function getTimeLabels(type: EntityType) {
  switch (type) {
    case EntityType.PERSON:
      return {
        startYear: 'Năm sinh',
        endYear: 'Năm mất',
        startDateLabel: 'Ngày sinh cụ thể (dạng chữ)',
        endDateLabel: 'Ngày mất cụ thể (dạng chữ)',
        startPlaceholder: '1228',
        endPlaceholder: '1300',
        startDatePlaceholder: 'Khoảng năm 1228, Đầu thế kỷ XIII...',
        endDatePlaceholder: 'Mùa thu năm Canh Tý (1300)...',
        taglinePlaceholder: 'Ví dụ: Quốc công Tiết chế, danh tướng nhà Trần...',
      };
    case EntityType.DYNASTY:
      return {
        startYear: 'Năm khởi lập / Lên ngôi',
        endYear: 'Năm kết thúc / Thoái vị',
        startDateLabel: 'Thời điểm khởi lập (dạng chữ)',
        endDateLabel: 'Thời điểm kết thúc (dạng chữ)',
        startPlaceholder: '1225',
        endPlaceholder: '1400',
        startDatePlaceholder: 'Tháng 12 năm Ất Dậu (1225)...',
        endDatePlaceholder: 'Năm Canh Thìn (1400)...',
        taglinePlaceholder: 'Ví dụ: Triều đại quân chủ dài nhất lịch sử Việt Nam...',
      };
    case EntityType.ORGANIZATION:
    case EntityType.MILITARY_FORCE:
      return {
        startYear: 'Năm thành lập / Ra đời',
        endYear: 'Năm giải thể / Hợp nhất',
        startDateLabel: 'Ngày thành lập (dạng chữ)',
        endDateLabel: 'Ngày kết thúc (dạng chữ)',
        startPlaceholder: '1944',
        endPlaceholder: '',
        startDatePlaceholder: 'Ngày 22 tháng 12 năm 1944...',
        endDatePlaceholder: 'Còn hoạt động đến nay...',
        taglinePlaceholder: 'Ví dụ: Lực lượng vũ trang nòng cốt của nhân dân Việt Nam...',
      };
    case EntityType.ARTIFACT:
      return {
        startYear: 'Niên đại chế tác / Xuất hiện',
        endYear: 'Niên đại thất lạc / Kết thúc',
        startDateLabel: 'Thời điểm chế tác (dạng chữ)',
        endDateLabel: 'Thời điểm phát hiện / Khảo cổ (dạng chữ)',
        startPlaceholder: '-500',
        endPlaceholder: '-200',
        startDatePlaceholder: 'Thế kỷ V - II TCN...',
        endDatePlaceholder: 'Phát hiện năm 1924 tại Đông Sơn, Thanh Hóa...',
        taglinePlaceholder: 'Ví dụ: Bảo vật quốc gia thời kỳ Văn hóa Đông Sơn...',
      };
    default:
      return {
        startYear: 'Năm bắt đầu',
        endYear: 'Năm kết thúc',
        startDateLabel: 'Thời điểm bắt đầu (dạng chữ)',
        endDateLabel: 'Thời điểm kết thúc (dạng chữ)',
        startPlaceholder: 'Năm bắt đầu',
        endPlaceholder: 'Năm kết thúc',
        startDatePlaceholder: 'Thời điểm bắt đầu...',
        endDatePlaceholder: 'Thời điểm kết thúc...',
        taglinePlaceholder: 'Ví dụ: Giới thiệu hoặc danh xưng ngắn nhận diện...',
      };
  }
}

export function EntityEditor({
  entityId,
  defaultType,
  returnRoute,
}: EntityEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(entityId);
  const targetReturnRoute = returnRoute || APP_ROUTES.ENTITIES.LIST;
  const isLocationMode =
    defaultType === EntityType.LOCATION ||
    returnRoute === APP_ROUTES.LOCATIONS.LIST;

  // Core Entity State
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>(
    defaultType ?? EntityType.PERSON,
  );
  const timeLabels = useMemo(() => getTimeLabels(type), [type]);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
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
  const [siteType, setSiteType] = useState<string>('MONUMENT');
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

  const [metadataJsonText, setMetadataJsonText] = useState('{}');
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);

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

  // New Relation Input State
  const [newTargetId, setNewTargetId] = useState('');
  const [newRelationType, setNewRelationType] = useState<string>(
    EntityRelationType.LEADER_OF,
  );
  const [newStartYear, setNewStartYear] = useState<number | ''>('');
  const [newEndYear, setNewEndYear] = useState<number | ''>('');
  const [newNote, setNewNote] = useState('');

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
      .then((data) => {
        setName(data.name || '');
        setType(data.type || EntityType.PERSON);
        setTagline(data.tagline || '');
        setDescription(data.description || '');
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
        setBirthYear(data.birthYear ?? '');
        setDeathYear(data.deathYear ?? '');
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
  }, [entityId, router]);

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
  const handleAddRelation = () => {
    if (!newTargetId) {
      alert('Vui lòng chọn thực thể đích cần liên kết.');
      return;
    }
    if (entityId && newTargetId === entityId) {
      alert('Không thể tạo quan hệ thực thể với chính nó.');
      return;
    }
    if (
      newStartYear !== '' &&
      newEndYear !== '' &&
      Number(newEndYear) < Number(newStartYear)
    ) {
      alert('Năm kết thúc mối quan hệ phải lớn hơn hoặc bằng năm bắt đầu.');
      return;
    }

    setRelations([
      ...relations,
      {
        targetEntityId: newTargetId,
        relationType: newRelationType,
        startYear: newStartYear !== '' ? Number(newStartYear) : undefined,
        endYear: newEndYear !== '' ? Number(newEndYear) : undefined,
        note: newNote.trim() || undefined,
      },
    ]);

    // Reset inputs
    setNewTargetId('');
    setNewRelationType(EntityRelationType.LEADER_OF);
    setNewStartYear('');
    setNewEndYear('');
    setNewNote('');
  };

  const handleRemoveRelation = (index: number) => {
    setRelations(relations.filter((_, idx) => idx !== index));
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

    // 2. Thời kỳ lịch sử (PERIOD)
    periods.forEach((p) => {
      const yearLabel =
        p.startYear !== undefined
          ? `${p.startYear} – ${p.endYear !== undefined && p.endYear !== null ? p.endYear : 'nay'}`
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

    // 3. Thực thể khác (Nhân vật, Địa điểm, Lực lượng, Hiện vật)
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
  }, [allEvents, periods, allEntities, entityId]);

  // Các thực thể & sự kiện đang liên kết với thực thể hiện tại
  const linkedKnowledgeItems: KnowledgeRelationItem[] = useMemo(() => {
    const list: KnowledgeRelationItem[] = [];

    // Thời kỳ (periodId hoặc periodIds)
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
          subtitle: 'Thời kỳ lịch sử chính',
          yearLabel:
            found.startYear !== undefined
              ? `${found.startYear} – ${found.endYear !== undefined && found.endYear !== null ? found.endYear : 'nay'}`
              : undefined,
        });
      }
    }

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
  }, [periodId, periods, linkedEvents, relations, allEntities]);

  const handleAddKnowledgeItems = (itemsToAdd: KnowledgeRelationItem[]) => {
    const newRelationsToAdd: RelationDraft[] = [];

    itemsToAdd.forEach((item) => {
      if (item.type === KnowledgeRelationType.PERIOD) {
        setPeriodId(item.rawId);
        if (!periodIds.includes(item.rawId)) {
          setPeriodIds([...periodIds, item.rawId]);
        }
      } else if (item.type === KnowledgeRelationType.EVENT) {
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
    if (id.startsWith('period:')) {
      const raw = id.replace('period:', '');
      if (periodId === raw) setPeriodId('');
      setPeriodIds((prev) => prev.filter((pid) => pid !== raw));
    } else if (id.startsWith('event:')) {
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
    const profileMetadata = isPerson ? figureProfileToMetadata(figureProfile) : undefined;
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
      birthYear: birthYear !== '' ? Number(birthYear) : undefined,
      deathYear: deathYear !== '' ? Number(deathYear) : undefined,
      birthDateLabel: birthDateLabel.trim() || undefined,
      deathDateLabel: deathDateLabel.trim() || undefined,
      roles: isPerson ? figureProfile.roles : undefined,
      biography: isPerson ? figureProfile.biography.trim() : undefined,
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
        await HistoricalEntityApiService.updateEntity(entityId, payload);
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

  // Form Sections Config (4 Tab tinh gọn)
  const sections: FormSectionConfig[] = [
    {
      id: 'general-info',
      stepNumber: 1,
      title: 'Thông tin chung',
      subtitle: 'Tên gọi, phân loại, danh xưng ngắn, hình ảnh, thời kỳ và niên đại hoạt động.',
      icon: IconName.TAG,
      content: (
        <div className="space-y-5">
          {/* 1. Tên và Phân loại */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="block mb-1 text-xs font-semibold text-slate-700">
                Tên thực thể lịch sử <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Trần Hưng Đạo, Nhà Hậu Lê, Trống đồng Đông Sơn..."
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block mb-1 text-xs font-semibold text-slate-700">
                Phân loại thực thể <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EntityType)}
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
              >
                {Object.entries(ENTITY_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Danh xưng / Mô tả nhận diện ngắn (1 dòng) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Danh xưng / Mô tả nhận diện ngắn (1 dòng)
              </label>
              <span className="text-[11px] text-slate-400">
                Hiển thị dưới tên ở danh sách, thẻ preview hoặc tooltip
              </span>
            </div>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={timeLabels.taglinePlaceholder}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* 3. Bí danh / Tên khác (Bỏ khung viền con bao quanh) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bí danh / Tên khác / Tước hiệu / Tên húy
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAlias();
                  }
                }}
                placeholder="Nhập tên khác (VD: Trần Quốc Tuấn, Hưng Đạo Đại Vương...) rồi nhấn Thêm"
                className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={handleAddAlias}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-2xs"
              >
                Thêm
              </button>
            </div>

            {aliases.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {aliases.map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium"
                  >
                    <span>{alias}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAlias(alias)}
                      className="text-amber-600 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4. Ảnh đại diện & Chú thích ảnh (Nằm ngay cạnh hoặc dưới ảnh, không khung bao) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-1">
            <div className="md:col-span-5">
              <TopicCoverImagePicker
                value={imageUrl}
                onChange={setImageUrl}
                title="Ảnh đại diện / Chân dung / Hiện vật"
                compact
              />
            </div>
            <div className="md:col-span-7 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Chú thích ảnh tư liệu (Caption)
              </label>
              <textarea
                rows={3}
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Ví dụ: Tượng đồng Hưng Đạo Đại Vương tại đền Kiếp Bạc, Hải Dương..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
              />
              <p className="text-[11px] text-slate-400">
                Hiển thị nguồn gốc hoặc thông tin hiện vật khi xem ảnh phóng to.
              </p>
            </div>
          </div>

          {/* 4.5. Thông tin chuyên biệt cho Địa danh / Di tích lịch sử (Chỉ hiện khi type = LOCATION) */}
          {type === EntityType.LOCATION && (
            <div className="pt-4 border-t border-slate-200/80 space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/60">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Thông tin Di tích / Địa danh lịch sử
                  </h4>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    Tọa độ bản đồ, địa chỉ hành chính và cấp bảo tồn di tích văn hóa.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Historical Site
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Địa chỉ cụ thể / Khu vực
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VD: 19C Hoàng Diệu, Quận Ba Đình, TP. Hà Nội"
                    className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Loại hình di tích
                  </label>
                  <TaxonomySelect
                    group={siteTaxonomies.SITE_TYPE}
                    value={siteType}
                    onChange={setSiteType}
                    emptyLabel={null}
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Vĩ độ (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : '')}
                    placeholder="VD: 21.0347"
                    className="w-full text-xs font-mono px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Dùng cắm ghim trên Bản đồ số</span>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kinh độ (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : '')}
                    placeholder="VD: 105.8407"
                    className="w-full text-xs font-mono px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Dùng cắm ghim trên Bản đồ số</span>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cấp xếp hạng di tích
                  </label>
                  <TaxonomySelect
                    group={siteTaxonomies.HERITAGE_RANK}
                    value={recognitionLevel}
                    onChange={setRecognitionLevel}
                    emptyLabel="Chưa xếp hạng"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tình trạng bảo tồn
                  </label>
                  <TaxonomySelect
                    group={siteTaxonomies.PRESERVATION}
                    value={preservationStatus}
                    onChange={setPreservationStatus}
                    emptyLabel="Chưa xác định"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cơ quan quản lý
                  </label>
                  <input
                    type="text"
                    value={managingAgency}
                    onChange={(e) => setManagingAgency(e.target.value)}
                    placeholder="VD: Trung tâm Bảo tồn Di sản..."
                    className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="md:col-span-12">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Ghi chú hiện trạng
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="VD: Đang tu bổ khu chính điện, mở cửa một phần..."
                    className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Hiển thị kèm nhóm hiện trạng trên trang di tích, không dùng để lọc</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Thời kỳ & Niên đại hoạt động (Hỗ trợ nhiều thời kỳ & Niên đại đa dạng) */}
          <div className="pt-5 border-t border-slate-200/80 space-y-5">
            {/* Header mục 5 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  Thời kỳ & Niên đại hoạt động
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Một thực thể có thể hoạt động hoặc gắn liền với nhiều giai đoạn lịch sử khác nhau.
                </p>
              </div>
              {periodIds.length > 0 && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 self-start sm:self-auto">
                  Đã chọn {periodIds.length} thời kỳ
                </span>
              )}
            </div>

            {/* Chọn nhiều thời kỳ / giai đoạn lịch sử */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Các thời kỳ / giai đoạn lịch sử liên quan
                </label>
                <span className="text-[11px] text-slate-400">
                  (Nhấp vào chip để chọn / bỏ chọn nhiều thời kỳ)
                </span>
              </div>

              {/* Danh sách các chip thời kỳ */}
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {periods.map((p) => {
                  const isSelected = periodIds.includes(p.id);
                  const isPrimary = periodId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const next = periodIds.filter((id) => id !== p.id);
                          setPeriodIds(next);
                          if (periodId === p.id) {
                            setPeriodId(next.length > 0 ? next[0] : '');
                          }
                        } else {
                          const next = [...periodIds, p.id];
                          setPeriodIds(next);
                          if (!periodId) {
                            setPeriodId(p.id);
                          }
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? isPrimary
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{p.name}</span>
                      {p.startYear && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded ${
                            isPrimary
                              ? 'bg-amber-700/80 text-amber-100'
                              : isSelected
                              ? 'bg-amber-200/70 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.startYear} - {p.endYear || '?'}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-xs leading-none ml-0.5">
                          {isPrimary ? '★' : '✓'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Đặt thời kỳ trọng tâm / chính */}
              {periodIds.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Thời kỳ tiêu biểu nhất (Chính):
                  </span>
                  <select
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-amber-900 focus:outline-none focus:border-amber-500"
                  >
                    {periodIds.map((pid) => {
                      const matched = periods.find((p) => p.id === pid);
                      return (
                        <option key={pid} value={pid}>
                          ★ {matched?.name || pid}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[11px] text-slate-400">
                    (Dùng làm mốc phân loại ưu tiên trên danh mục)
                  </span>
                </div>
              )}
            </div>

            {/* Khối niên đại chi tiết (Timeline & Nhãn văn bản) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Niên đại & Thời điểm hoạt động
                </span>
                <span className="text-[11px] text-slate-400">
                  Hỗ trợ số âm cho năm Trước Công Nguyên (TCN)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cột bắt đầu / Sinh */}
                <div className="p-3.5 bg-slate-50/60 border border-slate-200/60 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {timeLabels.startYear} <span className="font-normal text-slate-400">(Số năm)</span>
                    </label>
                    <input
                      type="number"
                      value={birthYear}
                      onChange={(e) =>
                        setBirthYear(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder={`Ví dụ: ${timeLabels.startPlaceholder}`}
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Dùng định vị trên trục Timeline & bộ lọc
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {timeLabels.startDateLabel} <span className="font-normal text-slate-400">(Văn bản hiển thị)</span>
                    </label>
                    <input
                      type="text"
                      value={birthDateLabel}
                      onChange={(e) => setBirthDateLabel(e.target.value)}
                      placeholder={`Ví dụ: ${timeLabels.startDatePlaceholder}`}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Cột kết thúc / Mất */}
                <div className="p-3.5 bg-slate-50/60 border border-slate-200/60 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {timeLabels.endYear} <span className="font-normal text-slate-400">(Số năm)</span>
                    </label>
                    <input
                      type="number"
                      value={deathYear}
                      onChange={(e) =>
                        setDeathYear(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder={`Ví dụ: ${timeLabels.endPlaceholder}`}
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Để trống nếu chưa rõ hoặc vẫn còn hoạt động
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {timeLabels.endDateLabel} <span className="font-normal text-slate-400">(Văn bản hiển thị)</span>
                    </label>
                    <input
                      type="text"
                      value={deathDateLabel}
                      onChange={(e) => setDeathDateLabel(e.target.value)}
                      placeholder={`Ví dụ: ${timeLabels.endDatePlaceholder}`}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {yearValidationError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-600 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{yearValidationError}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'content-detail',
      stepNumber: 2,
      title: 'Nội dung & Tiểu sử',
      subtitle: 'Soạn thảo nội dung lịch sử chi tiết bằng trình soạn thảo TipTap RichText.',
      icon: IconName.BOOK,
      content: (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-50/80 px-3.5 py-2 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Mô tả chi tiết / Tiểu sử nhân vật / Lịch sử triều đại / Hồ sơ hiện vật</span>
            </div>
            <TipTapContent
              value={description}
              onChange={setDescription}
              placeholder="Soạn thảo hành trạng, sự nghiệp, chiến công hoặc bối cảnh lịch sử chi tiết..."
            />
          </div>
          {type === EntityType.PERSON && (
            <FigureProfileFields value={figureProfile} onChange={setFigureProfile} />
          )}
        </div>
      ),
    },
    {
      id: 'related-entities',
      stepNumber: 3,
      title: 'Quan hệ & Bối cảnh',
      subtitle: 'Thiết lập liên kết đa chiều giữa thực thể này với Sự kiện tham gia, Nhân vật, Địa điểm và Thời kỳ.',
      icon: IconName.USERS,
      badgeCount: relations.length + incomingRelations.length + linkedEvents.length,
      content: (
        <div className="space-y-6">
          {/* Cụm 1: Khối Quản lý Quan hệ Tri thức chuẩn (KnowledgeRelationManager) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Liên kết Thực thể & Bối cảnh (Nhân vật, Thời kỳ, Địa điểm, Sự kiện)
              </span>
              <span className="text-[11px] text-slate-400">
                Đồ thị tri thức & Mạng lưới quan hệ ({linkedKnowledgeItems.length})
              </span>
            </div>

            <KnowledgeRelationManager
              availableItems={availableKnowledgeItems}
              linkedItems={linkedKnowledgeItems}
              onAddItems={handleAddKnowledgeItems}
              onRemoveItem={handleRemoveKnowledgeItem}
            />
          </div>

          {/* Cụm 2: Tùy chỉnh chi tiết Quan hệ Thực thể - Thực thể (N-N) */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Tùy chỉnh Quan hệ Thực thể nâng cao (Niên đại & Vai trò)
              </span>
              <span className="text-[11px] text-slate-400">
                Gán kiểu quan hệ chi tiết ({relations.length})
              </span>
            </div>

            {/* Form thêm quan hệ mới với Grid chuẩn:
                Hàng 1: Thực thể liên kết (50%) + Mối quan hệ (50%)
                Hàng 2: Từ năm (25%) + Đến năm (25%) + Ghi chú (50%)
            */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                + Thêm liên kết thực thể chi tiết
              </span>

              {/* Hàng 1: 50% + 50% */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Thực thể liên kết <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="">-- Chọn thực thể liên kết --</option>
                    {allEntities
                      .filter((e) => e.id !== entityId)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({ENTITY_TYPE_LABELS[e.type] || e.type})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Mối quan hệ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRelationType}
                    onChange={(e) =>
                      setNewRelationType(e.target.value)
                    }
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  >
                    {relationOptions(relationTerms, ENTITY_RELATION_TYPE_LABELS, newRelationType).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hàng 2: 25% + 25% + 50% */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Từ năm
                  </label>
                  <input
                    type="number"
                    value={newStartYear}
                    onChange={(e) =>
                      setNewStartYear(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="Năm bắt đầu"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Đến năm
                  </label>
                  <input
                    type="number"
                    value={newEndYear}
                    onChange={(e) =>
                      setNewEndYear(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="Năm kết thúc"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Ghi chú ngữ cảnh
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ví dụ: Tổng chỉ huy kháng chiến chống Nguyên Mông lần 2 và 3..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="text-right pt-1">
                <button
                  type="button"
                  onClick={handleAddRelation}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition shadow-2xs"
                >
                  Gắn liên kết
                </button>
              </div>
            </div>

            {/* Danh sách quan hệ đã gắn */}
            {relations.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                <div className="px-3.5 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
                  <span className="col-span-4">Thực thể liên kết</span>
                  <span className="col-span-3">Mối quan hệ</span>
                  <span className="col-span-4">Niên đại & Ghi chú</span>
                  <span className="col-span-1 text-right">Xóa</span>
                </div>
                {relations.map((rel, idx) => {
                  const target = allEntities.find((e) => e.id === rel.targetEntityId);
                  return (
                    <div
                      key={`${rel.targetEntityId}-${idx}`}
                      className="px-3.5 py-2.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition"
                    >
                      <div className="col-span-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>{target?.name || rel.targetEntityId}</span>
                      </div>
                      <div className="col-span-3 text-amber-700 font-medium">
                        {taxonomyRelationLabel(relationTerms, rel.relationType, 'OUTGOING', ENTITY_RELATION_TYPE_LABELS)}
                      </div>
                      <div className="col-span-4 text-slate-500 text-[11px]">
                        {rel.startYear ? `${rel.startYear} - ${rel.endYear || 'nay'}` : ''}
                        {rel.note ? ` (${rel.note})` : ''}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRelation(idx)}
                          className="text-slate-400 hover:text-rose-600 font-bold px-1"
                          title="Xóa liên kết"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Chưa có mối quan hệ liên kết nào. Sử dụng khung phía trên hoặc bảng Tri thức để thiết lập.
              </div>
            )}

            {/* Quan hệ nhận được (Incoming) nếu có */}
            {incomingRelations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-600 block mb-2">
                  Quan hệ hướng tới thực thể này (Incoming Relations)
                </span>
                <div className="text-xs text-slate-500 space-y-1">
                  {incomingRelations.map((inc) => (
                    <div key={inc.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                      <span>
                        <strong className="text-slate-800">{inc.sourceEntity?.name || inc.sourceEntityId}</strong>{' '}
                        — <em>{taxonomyRelationLabel(relationTerms, inc.relationType, 'INCOMING', ENTITY_RELATION_TYPE_LABELS)}</em>
                      </span>
                      <span className="text-[11px] text-slate-400">{inc.note || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'media-and-publish',
      stepNumber: 4,
      title: 'Tư liệu & Xuất bản',
      subtitle: 'Quản lý kho tư liệu ảnh, tài liệu PDF, cấu hình mở rộng và tùy chọn xuất bản.',
      icon: IconName.FILE,
      badgeCount: mediaList.length > 0 ? mediaList.length : undefined,
      content: (
        <div className="space-y-5">
          {/* Tái sử dụng LessonMediaManager */}
          <LessonMediaManager
            mediaList={mediaList}
            onAddMedia={handleAddMedia}
            onRemoveMedia={handleRemoveMedia}
          />

          {/* Cài đặt hiển thị & Metadata mở rộng */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Cài đặt hiển thị & Phân loại mở rộng
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span>Đánh dấu nổi bật (Hiển thị tại Landing Page)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Thứ tự hiển thị:</span>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                  className="w-20 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Dữ liệu mở rộng dạng JSON (Metadata: quê quán, kinh đô, bảo tàng lưu giữ...)
              </label>
              <textarea
                rows={3}
                value={metadataJsonText}
                onChange={(e) => setMetadataJsonText(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
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
    : [
        { label: 'Bảng điều khiển', href: APP_ROUTES.DASHBOARD },
        { label: 'Thực thể lịch sử', href: APP_ROUTES.ENTITIES.LIST },
        {
          label: isEdit
            ? `Chỉnh sửa: ${name || 'Thực thể'}`
            : 'Tạo mới thực thể lịch sử',
        },
      ];

  const pageTitle = isLocationMode
    ? isEdit
      ? name || 'Chỉnh sửa địa danh / di tích'
      : 'Tạo mới địa danh / di tích lịch sử'
    : isEdit
    ? name || 'Chỉnh sửa thực thể'
    : 'Tạo mới thực thể lịch sử';

  const pageSubtitle = isLocationMode
    ? 'Quản lý thông tin địa danh, di tích lịch sử, tọa độ địa lý, hiện trạng bảo tồn và sự kiện liên quan.'
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
    />
  );
}
