'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  EntityDetailLayout,
  DataCompletenessItem,
  FormSectionConfig,
} from '@/components/common/EntityDetailLayout';
import { TipTapContent } from '@/features/lessons/components/TipTapContent';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { ContentStatus } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import {
  PeriodApiService,
  CreatePeriodDto,
  UpdatePeriodDto,
} from '@/services/entities/period.service';
import { PeriodItem } from '@/types/models/period.type';
import { extractErrorMessage } from '@/services/api';
import { TaxonomyApiService, type TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { TaxonomySelect } from '@/features/taxonomy/TaxonomySelect';
import { formatHistoricalYear } from '@/utils/history-year.utils';

export interface PeriodEditorProps {
  periodId?: string;
}

export function PeriodEditor({ periodId }: PeriodEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(periodId);

  // Core Period State
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [startYear, setStartYear] = useState<number | ''>('');
  const [endYear, setEndYear] = useState<number | ''>('');
  const [timeLabel, setTimeLabel] = useState('');
  const [region, setRegion] = useState('Việt Nam');
  // Khu vực chọn từ "Danh mục dùng chung" (nhóm REGION) — lưu nhãn, backend tự gắn mã.
  const [regionGroup, setRegionGroup] = useState<TaxonomyGroupItem>();
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);

  // Related Data for View
  const [parentPeriod, setParentPeriod] = useState<{ id: string; name: string } | null>(null);
  const [childrenPeriods, setChildrenPeriods] = useState<PeriodItem['children']>([]);
  const [topics, setTopics] = useState<PeriodItem['topics']>([]);
  const [counts, setCounts] = useState<PeriodItem['_count']>({});

  // Reference List for parent selector
  const [allPeriods, setAllPeriods] = useState<PeriodItem[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [savingAction, setSavingAction] = useState<'DRAFT' | 'PUBLISH' | null>(null);

  // Fetch all periods for parent selector
  useEffect(() => {
    PeriodApiService.getPeriods({ limit: 100 })
      .then((res) => {
        setAllPeriods(res.items || []);
      })
      .catch((err) => {
        console.warn('Failed to fetch period list:', err);
      });
    TaxonomyApiService.getGroups(['REGION'])
      .then(([group]) => setRegionGroup(group))
      .catch((err) => console.warn('Failed to fetch regions:', err));
  }, []);

  // Fetch current period data if in Edit mode
  useEffect(() => {
    if (!periodId) return;

    setLoading(true);
    PeriodApiService.getPeriodById(periodId)
      .then((data) => {
        setName(data.name || '');
        setParentId(data.parentId || '');
        setParentPeriod(data.parent || null);
        setStartYear(data.startYear ?? '');
        setEndYear(data.endYear ?? '');
        setTimeLabel(data.timeLabel || '');
        setRegion(data.region || 'Việt Nam');
        setDescription(data.description || '');
        setCoverImageUrl(data.coverImageUrl || '');
        setDisplayOrder(data.displayOrder ?? 0);
        setStatus(data.status || ContentStatus.DRAFT);
        setChildrenPeriods(data.children || []);
        setTopics(data.topics || []);
        setCounts(data._count || {});
      })
      .catch((err) => {
        console.error('Failed to load period detail:', err);
        alert(extractErrorMessage(err, 'Không thể tải thông tin thời kỳ lịch sử.'));
      })
      .finally(() => setLoading(false));
  }, [periodId]);

  // Candidate parents: all periods except current period itself
  const parentCandidates = useMemo(() => {
    return allPeriods.filter((p) => p.id !== periodId);
  }, [allPeriods, periodId]);

  // Year range validation
  const yearValidationError = useMemo(() => {
    if (
      startYear !== '' &&
      endYear !== '' &&
      Number(endYear) < Number(startYear)
    ) {
      return 'Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu.';
    }
    return null;
  }, [startYear, endYear]);

  // Automatic time preview label
  const autoTimePreview = useMemo(() => {
    if (timeLabel.trim()) return timeLabel.trim();
    if (startYear === '' && endYear === '') return 'Chưa xác định thời gian';
    const startStr = startYear !== '' ? formatHistoricalYear(Number(startYear)) : 'Không rõ';
    const endStr = endYear !== '' ? formatHistoricalYear(Number(endYear)) : 'nay';
    return `${startStr} – ${endStr}`;
  }, [timeLabel, startYear, endYear]);

  // Data completeness calculation
  const completenessItems: DataCompletenessItem[] = useMemo(() => {
    return [
      {
        label: 'Tên thời kỳ / giai đoạn',
        description: 'Tên chính thức nhận diện kỷ nguyên lịch sử',
        completed: Boolean(name.trim()),
        required: true,
      },
      {
        label: 'Khung niên đại (Năm bắt đầu / Kết thúc)',
        description: 'Phạm vi thời gian ước định của thời kỳ',
        completed: startYear !== '' || Boolean(timeLabel.trim()),
        required: false,
      },
      {
        label: 'Mô tả / Tổng quan lịch sử',
        description: 'Soạn thảo bối cảnh lịch sử bằng TipTap',
        completed: Boolean(description && description.trim().length > 20),
        required: true,
      },
      {
        label: 'Ảnh bìa banner đại diện',
        description: 'Hình ảnh đại diện cho kỷ nguyên',
        completed: Boolean(coverImageUrl),
        required: false,
      },
      {
        label: 'Chủ đề học tập & Tiến trình con',
        description: 'Có chủ đề hoặc giai đoạn con trực thuộc',
        completed: (topics?.length || 0) > 0 || (childrenPeriods?.length || 0) > 0,
        required: false,
      },
    ];
  }, [name, startYear, timeLabel, description, coverImageUrl, topics, childrenPeriods]);

  // Save Handler
  const handleSave = async (targetStatus: ContentStatus) => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên thời kỳ / giai đoạn lịch sử.');
      return;
    }
    if (yearValidationError) {
      alert(yearValidationError);
      return;
    }

    setSavingAction(targetStatus === ContentStatus.PUBLISHED ? 'PUBLISH' : 'DRAFT');

    const payload: CreatePeriodDto | UpdatePeriodDto = {
      name: name.trim(),
      parentId: parentId || null,
      startYear: startYear !== '' ? Number(startYear) : null,
      endYear: endYear !== '' ? Number(endYear) : null,
      timeLabel: timeLabel.trim() || undefined,
      region: region.trim() || 'Việt Nam',
      description: description.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      displayOrder: Number(displayOrder) || 0,
      status: targetStatus,
    };

    try {
      if (isEdit && periodId) {
        await PeriodApiService.updatePeriod(periodId, payload);
      } else {
        await PeriodApiService.createPeriod(payload as CreatePeriodDto);
      }
      router.push(APP_ROUTES.PERIODS.LIST);
    } catch (err) {
      console.error('Failed to save period:', err);
      alert(extractErrorMessage(err, 'Lưu thời kỳ lịch sử thất bại.'));
    } finally {
      setSavingAction(null);
    }
  };

  // Form Sections Config (4 Tab Chuẩn)
  const sections: FormSectionConfig[] = [
    {
      id: 'general-info',
      stepNumber: 1,
      title: 'Thông tin chung & Niên đại',
      subtitle: 'Tên thời kỳ, giai đoạn cha, khung niên đại, khu vực và ảnh bìa đại diện.',
      icon: IconName.TAG,
      content: (
        <div className="space-y-5">
          {/* 1. Tên thời kỳ & Thời kỳ cha */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <label className="block mb-1 text-xs font-semibold text-slate-700">
                Tên thời kỳ / Giai đoạn lịch sử <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Thời kỳ Bắc thuộc và Chống Bắc thuộc, Thời nhà Trần..."
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block mb-1 text-xs font-semibold text-slate-700">
                Thuộc thời kỳ cha (Phân cấp kỷ nguyên)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
              >
                <option value="">-- Là thời kỳ độc lập / Kỷ nguyên gốc --</option>
                {parentCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.startYear ? `(${p.startYear})` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nếu đây là giai đoạn con (ví dụ: Thời Trưng Nữ Vương thuộc Thời kỳ Bắc thuộc).
              </span>
            </div>
          </div>

          {/* 2. Niên đại & Nhãn chữ hiển thị */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name={IconName.CLOCK} className="w-3.5 h-3.5 text-amber-600" />
                Khung Niên Đại Thời Kỳ
              </span>
              <span className="text-xs text-amber-800 font-semibold bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                Hiển thị: {autoTimePreview}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Năm bắt đầu (Số nguyên)
                </label>
                <input
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: -179 hoặc 1954"
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Nhập số âm nếu là TCN</span>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Năm kết thúc (Số nguyên)
                </label>
                <input
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: 938 hoặc 1975"
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Để trống nếu tiếp diễn</span>
              </div>

              <div className="md:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nhãn niên đại dạng chữ (Tùy chọn hiển thị)
                </label>
                <input
                  type="text"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  placeholder="Ví dụ: thế kỷ VII TCN - thế kỷ II TCN, hoặc Năm 1954 - 1975"
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ưu tiên hiển thị chữ này thay vì số ghép nếu có nhập
                </span>
              </div>
            </div>

            {yearValidationError && (
              <p className="text-xs text-rose-600 font-medium">{yearValidationError}</p>
            )}
          </div>

          {/* 3. Khu vực địa lý & Ảnh bìa */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-5">
              <TopicCoverImagePicker
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                title="Ảnh bìa thời kỳ / Banner đại diện"
                compact
              />
            </div>

            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phạm vi địa lý / Vùng miền
                </label>
                <TaxonomySelect
                  group={regionGroup}
                  value={region}
                  onChange={setRegion}
                  valueKey="label"
                  emptyLabel={null}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Thiếu khu vực? Thêm ở mục &quot;Danh mục dùng chung&quot;.
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Icon name={IconName.BOOK} className="w-3.5 h-3.5 text-amber-600" />
                  Thống kê liên kết tri thức
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>Chủ đề trực thuộc: <span className="font-bold text-slate-900">{counts?.topics || topics?.length || 0}</span></div>
                  <div>Giai đoạn con: <span className="font-bold text-slate-900">{counts?.children || childrenPeriods?.length || 0}</span></div>
                  <div>Sự kiện lịch sử: <span className="font-bold text-slate-900">{counts?.historicalEvents || 0}</span></div>
                  <div>Thực thể lịch sử: <span className="font-bold text-slate-900">{counts?.historicalEntities || 0}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'content',
      stepNumber: 2,
      title: 'Tổng quan lịch sử',
      subtitle: 'Soạn thảo bối cảnh lịch sử, ý nghĩa và diễn biến chủ đạo của thời kỳ bằng TipTap.',
      icon: IconName.BOOK,
      content: (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Nội dung bài viết tổng quan <span className="text-rose-500">*</span>
          </label>
          <TipTapContent
            value={description}
            onChange={setDescription}
            placeholder="Nhập nội dung tổng quan bối cảnh thời kỳ, các sự biến trọng đại, chuyển dịch kinh tế - xã hội..."
          />
        </div>
      ),
    },
    {
      id: 'topics-and-children',
      stepNumber: 3,
      title: 'Chủ đề học tập & Tiến trình con',
      subtitle: 'Danh mục các Chủ đề (Topics) và các Giai đoạn lịch sử con trực thuộc thời kỳ này.',
      icon: IconName.GRID,
      content: (
        <div className="space-y-6">
          {/* Khối 1: Danh sách Chủ đề học tập (Topics) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                  Chủ đề học tập trực thuộc (Topics)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Các chủ đề bài học gắn liền với thời kỳ này trong chương trình lịch sử.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.TOPICS.CREATE)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Icon name={IconName.PLUS} className="w-3.5 h-3.5" />
                Tạo chủ đề mới
              </button>
            </div>

            {topics && topics.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                <div className="px-3.5 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
                  <span className="col-span-6">Tên chủ đề</span>
                  <span className="col-span-3">Tiêu đề phụ (Eyebrow)</span>
                  <span className="col-span-2">Trạng thái</span>
                  <span className="col-span-1 text-right">Xem</span>
                </div>
                {topics.map((t) => (
                  <div
                    key={t.id}
                    className="px-3.5 py-2.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition"
                  >
                    <div className="col-span-6 font-semibold text-slate-900 flex items-center gap-2">
                      <Icon name={IconName.BOOK} className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{t.name}</span>
                      {t.isFeatured && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          Nổi bật
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-slate-500 text-[11px]">
                      {t.eyebrow || '—'}
                    </div>
                    <div className="col-span-2">
                      <Badge tone={STATUS_TONE_MAP[t.status || ContentStatus.DRAFT]}>
                        {STATUS_LABEL_MAP[t.status || ContentStatus.DRAFT]}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(APP_ROUTES.TOPICS.DETAIL(t.id))}
                        className="text-slate-400 hover:text-blue-600 transition"
                      >
                        <Icon name={IconName.EYE} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Thời kỳ này hiện chưa có chủ đề học tập nào. Các chủ đề khi tạo sẽ có thể chọn gắn vào thời kỳ này.
              </div>
            )}
          </div>

          {/* Khối 2: Danh sách Giai đoạn con (Children Periods) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Giai đoạn lịch sử con (Cây phân cấp)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Các mốc phân kỳ chi tiết nằm trong thời kỳ lớn này.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.PERIODS.CREATE)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Icon name={IconName.PLUS} className="w-3.5 h-3.5" />
                Thêm giai đoạn con
              </button>
            </div>

            {childrenPeriods && childrenPeriods.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                <div className="px-3.5 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
                  <span className="col-span-6">Tên giai đoạn con</span>
                  <span className="col-span-3">Niên đại</span>
                  <span className="col-span-2">Trạng thái</span>
                  <span className="col-span-1 text-right">Xem</span>
                </div>
                {childrenPeriods.map((c) => (
                  <div
                    key={c.id}
                    className="px-3.5 py-2.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition"
                  >
                    <div className="col-span-6 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>{c.name}</span>
                    </div>
                    <div className="col-span-3 text-slate-500 text-[11px]">
                      {c.timeLabel || (c.startYear ? `${c.startYear} – ${c.endYear || 'nay'}` : '—')}
                    </div>
                    <div className="col-span-2">
                      <Badge tone={STATUS_TONE_MAP[c.status || ContentStatus.DRAFT]}>
                        {STATUS_LABEL_MAP[c.status || ContentStatus.DRAFT]}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(APP_ROUTES.PERIODS.DETAIL(c.id))}
                        className="text-slate-400 hover:text-emerald-600 transition"
                      >
                        <Icon name={IconName.EYE} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Chưa có giai đoạn con nào trực thuộc thời kỳ này.
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      stepNumber: 4,
      title: 'Cài đặt hiển thị & Xuất bản',
      subtitle: 'Thứ tự ưu tiên hiển thị và trạng thái phát hành trên hệ thống.',
      icon: IconName.GRID,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thứ tự hiển thị trên danh mục
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Số nhỏ hơn sẽ được ưu tiên hiển thị trước.
              </span>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái phát hành hiện tại
              </label>
              <div className="pt-2">
                <Badge tone={STATUS_TONE_MAP[status]}>
                  {STATUS_LABEL_MAP[status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        Đang tải thông tin thời kỳ lịch sử...
      </div>
    );
  }

  return (
    <EntityDetailLayout
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: APP_ROUTES.DASHBOARD },
        { label: 'Thời kỳ lịch sử', href: APP_ROUTES.PERIODS.LIST },
        {
          label: isEdit
            ? `Chỉnh sửa: ${name || 'Thời kỳ'}`
            : 'Tạo mới thời kỳ lịch sử',
        },
      ]}
      title={isEdit ? name || 'Chỉnh sửa thời kỳ' : 'Tạo mới thời kỳ lịch sử'}
      subtitle="Quản lý niên đại kỷ nguyên, cây phân cấp giai đoạn con và danh mục chủ đề học tập trực thuộc."
      recordId={periodId}
      status={status}
      savingAction={savingAction}
      onSaveDraft={() => handleSave(ContentStatus.DRAFT)}
      onPublish={() => handleSave(ContentStatus.PUBLISHED)}
      onCancel={() => router.push(APP_ROUTES.PERIODS.LIST)}
      sections={sections}
    />
  );
}
