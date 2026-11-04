'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  EntityDetailLayout,
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
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { TaxonomyApiService, type TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { TaxonomySelect } from '@/features/taxonomy/TaxonomySelect';
import { formatHistoricalYear } from '@/utils/history-year.utils';

export interface PeriodEditorProps {
  periodId?: string;
}

const SKELETON_OVERVIEW = `<h2>1. Bối cảnh lịch sử & Không gian địa lý</h2><p>Khái quát về bối cảnh hình thành, cương thổ và điều kiện tự nhiên - xã hội trong giai đoạn này...</p><h2>2. Đặc trưng kinh tế - văn hóa & Đời sống xã hội</h2><p>Các chuyển biến về thể chế, sản xuất nông nghiệp/thương mại, tín ngưỡng và văn hóa chủ đạo...</p><h2>3. Vị trí thời đại & Ý nghĩa lịch sử</h2><p>Đóng góp của thời kỳ đối với tiến trình phát triển chung của dân tộc hoặc khu vực...</p>`;

const SKELETON_MILESTONES = `<h2>1. Sự kiện mở đầu & Xác lập kỷ nguyên</h2><p>Nguyên nhân và biến cố lịch sử đánh dấu sự bắt đầu của thời kỳ này...</p><h2>2. Các bước ngoặt & Diễn biến chủ đạo</h2><p>Tóm lược những xung đột, cải cách hoặc thành tựu nổi bật xuyên suốt thời gian tồn tại...</p><h2>3. Chuyển giao & Kết thúc</h2><p>Bối cảnh khép lại thời kỳ và mở ra giai đoạn lịch sử kế tiếp...</p>`;

export function PeriodEditor({ periodId }: PeriodEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(periodId);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Core Period State
  const [name, setName] = useState('');
  const [summary, setSummary] = useState(''); // Tóm tắt ngắn 150-250 ký tự cho thẻ Timeline/Card
  const [parentId, setParentId] = useState<string>('');
  const [startYear, setStartYear] = useState<number | ''>('');
  const [endYear, setEndYear] = useState<number | ''>('');
  const [timeLabel, setTimeLabel] = useState('');
  const [region, setRegion] = useState('Việt Nam');
  const [regionGroup, setRegionGroup] = useState<TaxonomyGroupItem>();
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [colorTheme, setColorTheme] = useState('#8c5338'); // Màu sắc kỷ nguyên khi không có ảnh thật
  const [visualMode, setVisualMode] = useState<'IMAGE' | 'COLOR_THEME'>('IMAGE');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
      .then((fetched) => withPendingDraft('PERIOD', periodId, fetched))
      .then(({ detail: data, pending }) => {
        setPendingRevision(pending);
        setName(data.name || '');
        setParentId(data.parentId || '');
        setParentPeriod(data.parent || null);
        setStartYear(data.startYear ?? '');
        setEndYear(data.endYear ?? '');
        setTimeLabel(data.timeLabel || '');
        const currentRegion = data.region || 'Việt Nam';
        setRegion(currentRegion);

        // Tách lead summary và detailed description nếu có
        if (data.description) {
          const leadMatch = data.description.match(/^<p class="lead[^>]*>([\s\S]*?)<\/p>/i);
          if (leadMatch) {
            setSummary(leadMatch[1].replace(/<[^>]*>/g, '').trim());
            setDescription(data.description.replace(leadMatch[0], '').trim());
          } else if (!data.description.includes('<') && data.description.length <= 300) {
            setSummary(data.description.trim());
            setDescription('');
          } else {
            setDescription(data.description);
          }
        } else {
          setSummary('');
          setDescription('');
        }

        setCoverImageUrl(data.coverImageUrl || '');
        if (!data.coverImageUrl) {
          setVisualMode('COLOR_THEME');
        }
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
  }, [periodId, reloadKey]);

  // Candidate parents: all periods except current period itself
  const parentCandidates = useMemo(() => {
    return allPeriods.filter((p) => p.id !== periodId);
  }, [allPeriods, periodId]);

  // Year range validation (chỉ validate khi có cả 2 số nguyên hợp lệ)
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

  // Data completeness checklist items with jump targets
  const checklist = useMemo(() => {
    const isNameValid = Boolean(name.trim());
    const isChronologyValid = startYear !== '' || Boolean(timeLabel.trim());
    const isSummaryValid = Boolean(summary.trim());
    const isDescValid = Boolean(description && description.trim().length > 20);
    const isVisualValid = Boolean(coverImageUrl || visualMode === 'COLOR_THEME');
    const isHierarchyValid = (topics?.length || 0) > 0 || (childrenPeriods?.length || 0) > 0;

    return [
      {
        id: 'name',
        label: 'Tên thời kỳ lịch sử',
        description: 'Tên chính thức nhận diện kỷ nguyên lịch sử',
        completed: isNameValid,
        required: true,
        targetStepIndex: 0,
      },
      {
        id: 'summary',
        label: 'Tóm tắt ngắn (Thẻ Timeline & Card)',
        description: '1-2 câu khái quát đặc trưng cốt lõi (150-250 ký tự)',
        completed: isSummaryValid,
        required: false,
        targetStepIndex: 0,
      },
      {
        id: 'chronology',
        label: 'Khung niên đại (Bắt đầu / Kết thúc)',
        description: 'Định vị số năm hoặc có nhãn chữ hiển thị',
        completed: isChronologyValid,
        required: false,
        targetStepIndex: 0,
      },
      {
        id: 'description',
        label: 'Mô tả / Tổng quan lịch sử',
        description: 'Bài viết tổng quan bối cảnh thời kỳ ở Mục 2',
        completed: isDescValid,
        required: false,
        targetStepIndex: 1,
      },
      {
        id: 'visual',
        label: 'Ảnh bìa hoặc Màu sắc đại diện',
        description: 'Hình ảnh tư liệu hoặc bảng màu vẽ thanh Timeline',
        completed: isVisualValid,
        required: false,
        targetStepIndex: 0,
      },
      {
        id: 'hierarchy',
        label: 'Chủ đề học tập & Tiến trình con',
        description: isEdit
          ? 'Đã gắn chủ đề hoặc giai đoạn con trực thuộc'
          : 'Có thể thiết lập sau khi lưu thời kỳ này',
        completed: isHierarchyValid,
        required: false,
        targetStepIndex: 2,
      },
    ];
  }, [name, summary, startYear, timeLabel, description, coverImageUrl, visualMode, topics, childrenPeriods, isEdit]);

  const completedCount = checklist.filter((i) => i.completed).length;
  const isAllRequiredDone = checklist.filter((i) => i.required).every((i) => i.completed);

  // Save Handler
  const handleSave = async (targetStatus?: ContentStatus) => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên thời kỳ lịch sử.');
      setActiveStepIndex(0);
      return;
    }
    if (yearValidationError) {
      alert(yearValidationError);
      setActiveStepIndex(0);
      return;
    }

    const effectiveStatus = targetStatus || status;
    setSavingAction(effectiveStatus === ContentStatus.PUBLISHED ? 'PUBLISH' : 'DRAFT');

    // Kết hợp summary và description thành cấu trúc chuẩn
    let combinedDescription = description.trim();
    if (summary.trim()) {
      const leadHtml = `<p class="lead font-medium text-slate-700">${summary.trim()}</p>`;
      combinedDescription = combinedDescription
        ? `${leadHtml}\n\n${combinedDescription}`
        : leadHtml;
    }

    const payload: CreatePeriodDto | UpdatePeriodDto = {
      name: name.trim(),
      parentId: parentId || null,
      startYear: startYear !== '' ? Number(startYear) : null,
      endYear: endYear !== '' ? Number(endYear) : null,
      timeLabel: timeLabel.trim() || undefined,
      region: region.trim() || 'Việt Nam',
      description: combinedDescription || undefined,
      coverImageUrl: visualMode === 'IMAGE' ? (coverImageUrl.trim() || undefined) : undefined,
      displayOrder: Number(displayOrder) || 0,
      status: effectiveStatus,
    };

    try {
      if (isEdit && periodId) {
        const saved = await PeriodApiService.updatePeriod(periodId, payload);
        if (isRevisionPending(saved)) {
          setPendingRevision(saved.revision);
          setRevisionNotice(saved.message);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setSavingAction(null);
          return;
        }
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

  // Form Sections Config (4 Bước Chuẩn)
  const sections: FormSectionConfig[] = [
    {
      id: 'general-info',
      stepNumber: 1,
      title: 'Thông tin chung & Niên đại',
      subtitle: 'Tên thời kỳ, tóm tắt cốt lõi, khung niên đại, khu vực và nhận diện trực quan.',
      icon: IconName.TAG,
      content: (
        <div className="space-y-6">
          {/* 1. Tên thời kỳ & Phân cấp & Tóm tắt ngắn */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <label className="block mb-1.5 text-xs font-bold text-slate-800">
                  Tên thời kỳ lịch sử <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Thời kỳ Bắc thuộc, Thời kỳ Phục Hưng, Thời kỳ Kháng chiến chống Mỹ..."
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="md:col-span-5">
                <label className="block mb-1.5 text-xs font-bold text-slate-800">
                  Thuộc thời kỳ cha (Phân cấp hộp lồng hộp)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="">-- Là thời kỳ độc lập / Kỷ nguyên gốc --</option>
                  {parentCandidates.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.startYear ? `(${p.startYear})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Chọn thời kỳ cha nếu đây là phân kỳ con (Ví dụ: Bắc thuộc lần 1 thuộc Thời kỳ Bắc thuộc).
                </span>
              </div>
            </div>

            {/* Trường hợp B: Tóm tắt ngắn (150-250 ký tự) cho thẻ Timeline & Card */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Tóm tắt ngắn / Đặc trưng cốt lõi (Thẻ Timeline & Card)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {summary.length}/250 ký tự gợi ý
                </span>
              </div>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ví dụ: Hơn 1000 năm kiên cường đấu tranh bảo vệ bản sắc và giành lại quyền tự chủ của dân tộc Việt Nam..."
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition leading-relaxed resize-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                💡 Giữ cô đọng từ 100 - 250 ký tự. Dùng để hiển thị trên thẻ card Timeline, trang chủ và kết quả tìm kiếm khi học sinh tra cứu.
              </span>
            </div>
          </div>

          {/* 2. Niên đại & Nhãn chữ hiển thị (Xử lý thấu đáo Trường hợp A) */}
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
                  Năm bắt đầu (Số định vị Timeline)
                </label>
                <input
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: -700, 1010, 1400..."
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                  Dùng định vị mốc tọa độ trên Timeline (Thế kỷ XV nhập ước lượng 1400, Thế kỷ VII TCN nhập -700).
                </span>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Năm kết thúc (Số định vị Timeline)
                </label>
                <input
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: 938, 1975..."
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                  Để trống nếu chưa rõ hoặc kỷ nguyên tiếp diễn.
                </span>
              </div>

              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center gap-1">
                  <span>Nhãn niên đại dạng chữ (Ưu tiên hiển thị cho người học)</span>
                  <span className="text-amber-600">⭐</span>
                </label>
                <input
                  type="text"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  placeholder="Ví dụ: Thế kỷ VII TCN – Thế kỷ II TCN, hoặc Thời Tiền sử..."
                  className="w-full text-xs px-3.5 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 transition font-medium"
                />
                <span className="text-[10px] text-amber-900 mt-0.5 block leading-tight">
                  🌟 &ldquo;Phao cứu sinh&rdquo; cho thời kỳ cổ đại: Hệ thống sẽ ưu tiên hiển thị dòng chữ này cho người học thay vì số ghép.
                </span>
              </div>
            </div>

            {yearValidationError && (
              <p className="text-xs text-rose-600 font-medium">{yearValidationError}</p>
            )}
          </div>

          {/* 3. Nhận diện trực quan (Xử lý thấu đáo Trường hợp C: Ảnh bìa hoặc Bảng màu kỷ nguyên) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Nhận diện hình ảnh / Màu sắc đại diện
                </label>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setVisualMode('IMAGE')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      visualMode === 'IMAGE'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ảnh tư liệu
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualMode('COLOR_THEME')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      visualMode === 'COLOR_THEME'
                        ? 'bg-white text-amber-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Màu sắc kỷ nguyên
                  </button>
                </div>
              </div>

              {visualMode === 'IMAGE' ? (
                <div>
                  <TopicCoverImagePicker
                    value={coverImageUrl}
                    onChange={setCoverImageUrl}
                    title="Ảnh bìa thời kỳ / Banner đại diện"
                    compact
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Khuyên dùng tranh khắc, di vật khảo cổ, bản đồ cổ hoặc ảnh tư liệu lịch sử.
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Tự chọn mã màu hoặc tạo ngẫu nhiên:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const randomColor = `#${Math.floor(Math.random() * 16777215)
                          .toString(16)
                          .padStart(6, '0')}`;
                        setColorTheme(randomColor);
                      }}
                      className="text-xs px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
                    >
                      <span>🎲</span>
                      <span>Đổi màu ngẫu nhiên</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <input
                      type="color"
                      value={colorTheme}
                      onChange={(e) => setColorTheme(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5 shrink-0 bg-transparent"
                      title="Nhấp để mở bảng chọn màu"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Mã màu HEX
                      </label>
                      <input
                        type="text"
                        value={colorTheme}
                        onChange={(e) => setColorTheme(e.target.value)}
                        placeholder="#8C5338"
                        className="w-full text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Bản xem trước dải banner tạo bằng màu */}
                  <div
                    className="h-16 rounded-xl flex items-center justify-between px-4 text-white shadow-xs transition-colors"
                    style={{
                      background: `linear-gradient(135deg, ${colorTheme} 0%, #1a1a1a 100%)`,
                    }}
                  >
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                        Thanh nhận diện Timeline
                      </div>
                      <div className="text-xs font-bold mt-0.5 truncate">
                        {name || 'Kỷ nguyên lịch sử'}
                      </div>
                    </div>
                    <span className="text-xl">🏛️</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    💡 Màu này dùng để tô dải màu của thời kỳ trên trục Timeline và làm banner nền khi không có ảnh chụp tư liệu.
                  </span>
                </div>
              )}
            </div>

            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Phạm vi địa lý / Vùng miền chi tiết
                </label>
                <TaxonomySelect
                  group={regionGroup}
                  value={region}
                  onChange={setRegion}
                  valueKey="label"
                  emptyLabel={null}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Địa bàn diễn ra chính (Đồng bằng Bắc Bộ, Thăng Long, Cả nước, Đông Nam Á...).
                </span>
              </div>

              {/* Chỉ hiện thống kê liên kết tri thức khi đang chỉnh sửa thời kỳ đã có ID */}
              {isEdit && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Icon name={IconName.BOOK} className="w-3.5 h-3.5 text-amber-600" />
                    Thống kê liên kết tri thức
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      Chủ đề trực thuộc:{' '}
                      <span className="font-bold text-slate-900">
                        {counts?.topics || topics?.length || 0}
                      </span>
                    </div>
                    <div>
                      Giai đoạn con:{' '}
                      <span className="font-bold text-slate-900">
                        {counts?.children || childrenPeriods?.length || 0}
                      </span>
                    </div>
                    <div>
                      Sự kiện lịch sử:{' '}
                      <span className="font-bold text-slate-900">
                        {counts?.historicalEvents || 0}
                      </span>
                    </div>
                    <div>
                      Thực thể lịch sử:{' '}
                      <span className="font-bold text-slate-900">
                        {counts?.historicalEntities || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'content',
      stepNumber: 2,
      title: 'Tổng quan lịch sử',
      subtitle:
        'Khái quát bối cảnh xã hội, chính trị và đặc điểm chung của lát cắt thời gian này.',
      icon: IconName.BOOK,
      content: (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Nội dung bài viết tổng quan về thời kỳ <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Thời kỳ là &ldquo;cái hộp thời gian&rdquo; quy ước chứa đựng mọi diễn biến, nhân vật và di tích bên trong.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Gợi ý dàn bài:</span>
              <button
                type="button"
                onClick={() => {
                  if (
                    description &&
                    !confirm('Chèn dàn ý mẫu sẽ thay thế nội dung hiện tại. Bạn có chắc chắn không?')
                  ) {
                    return;
                  }
                  setDescription(SKELETON_OVERVIEW);
                }}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
              >
                + Bối cảnh & Ý nghĩa
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    description &&
                    !confirm('Chèn dàn ý mẫu sẽ thay thế nội dung hiện tại. Bạn có chắc chắn không?')
                  ) {
                    return;
                  }
                  setDescription(SKELETON_MILESTONES);
                }}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
              >
                + Tiến trình mở - kết
              </button>
            </div>
          </div>
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
          {!isEdit ? (
            <div className="p-6 bg-gradient-to-br from-amber-50/80 via-white to-slate-50 border border-amber-200/90 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                <span className="text-base">💡</span>
                <span>Chủ đề học tập & Giai đoạn con khả dụng sau khi lưu</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed max-w-[70ch]">
                Do thời kỳ lịch sử này hiện chưa được khởi tạo trong cơ sở dữ liệu, hệ thống chưa có mã định danh (ID) để gắn kết các Chủ đề học tập (Topics) hoặc phân nhánh các Giai đoạn con trực thuộc.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vui lòng tiếp tục sang <strong>Mục 4 (Kiểm duyệt & Xuất bản)</strong> để hoàn tất và lưu thời kỳ. Sau khi lưu thành công, bạn có thể chỉnh sửa để mở toàn bộ tính năng quản lý tiến trình con tại đây mà không lo mất dữ liệu.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStepIndex(3)}
                  className="text-xs font-semibold px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Chuyển đến Kiểm duyệt & Xuất bản</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      ),
    },
    {
      id: 'settings',
      stepNumber: 4,
      title: 'Kiểm duyệt & Xuất bản',
      subtitle: 'Kiểm tra độ hoàn thiện dữ liệu, thứ tự hiển thị và trạng thái công bố.',
      icon: IconName.CHECK,
      content: (
        <div className="space-y-6 max-w-4xl mx-auto py-2">
          {/* 1. Thẻ tóm tắt thông tin thời kỳ (Live Preview Card) */}
          <div className="bg-gradient-to-br from-amber-50/60 via-white to-slate-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {visualMode === 'IMAGE' && coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={name || 'Ảnh bìa thời kỳ'}
                  className="w-28 h-28 sm:w-32 sm:h-28 rounded-xl object-cover border border-amber-200 shrink-0 shadow-2xs"
                />
              ) : (
                <div
                  className="w-28 h-28 sm:w-32 sm:h-28 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-2xs p-3 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${colorTheme} 0%, #1a1a1a 100%)`,
                  }}
                >
                  <span className="text-2xl">🏛️</span>
                  <span className="text-[10px] mt-1 font-semibold uppercase opacity-90 truncate max-w-full">
                    {region || 'Thời kỳ'}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Thời kỳ lịch sử
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-800 border border-stone-300">
                    {region}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Trạng thái: {STATUS_LABEL_MAP[status]}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-2 truncate">
                  {name || <span className="text-slate-400 italic font-normal">Chưa đặt tên thời kỳ</span>}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Niên đại hiển thị:</span>{' '}
                    <strong className="text-amber-900 font-bold">{autoTimePreview}</strong>
                  </div>
                  {parentId && (
                    <div>
                      <span className="text-slate-400">Trực thuộc:</span>{' '}
                      <strong className="text-slate-800">
                        {parentPeriod?.name || parentCandidates.find((p) => p.id === parentId)?.name || 'Kỷ nguyên cha'}
                      </strong>
                    </div>
                  )}
                  {displayOrder > 0 && (
                    <div>
                      <span className="text-slate-400">Ưu tiên:</span>{' '}
                      <strong className="text-slate-800">#{displayOrder}</strong>
                    </div>
                  )}
                </div>

                {summary ? (
                  <p className="text-xs text-slate-700 mt-2.5 line-clamp-2 leading-relaxed bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    <strong>Tóm tắt:</strong> {summary}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-2">Chưa có tóm tắt đặc trưng cốt lõi</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Bảng kiểm tra mức độ sẵn sàng (Readiness Checklist) */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh mục kiểm tra chất lượng dữ liệu ({completedCount}/{checklist.length})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm vào các mục chưa hoàn thành (!) để chuyển nhanh đến màn hình cần bổ sung thông tin.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isAllRequiredDone
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isAllRequiredDone ? 'Đủ điều kiện xuất bản' : 'Cần bổ sung'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveStepIndex(item.targetStepIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveStepIndex(item.targetStepIndex);
                    }
                  }}
                  className="py-3 flex items-start justify-between gap-3 group transition cursor-pointer hover:bg-white/80 px-2 rounded-xl"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border transition-transform group-hover:scale-105 ${
                        item.completed
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      {item.completed ? '✓' : '!'}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.required && (
                          <span className="text-[10px] text-rose-500 font-normal">
                            (Bắt buộc)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {!item.completed && (
                    <span className="text-xs font-semibold text-amber-800 group-hover:text-amber-950 underline shrink-0">
                      Bổ sung ngay →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Cài đặt phát hành & Thứ tự hiển thị */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Trạng thái bài viết & Cài đặt hiển thị
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: ContentStatus.DRAFT,
                  title: 'Bản nháp',
                  desc: 'Chỉ lưu trong hệ thống quản trị, chưa hiển thị ra ngoài timeline.',
                },
                {
                  value: ContentStatus.PENDING_REVIEW,
                  title: 'Chờ kiểm duyệt',
                  desc: 'Gửi ban biên tập thẩm định niên đại và nội dung lịch sử.',
                },
                {
                  value: ContentStatus.PUBLISHED,
                  title: 'Đã xuất bản',
                  desc: 'Công khai trên Trục thời gian Timeline, Lộ trình học và Bản đồ.',
                },
              ].map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition select-none ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="radio"
                        name="period_review_status"
                        checked={isSelected}
                        onChange={() => setStatus(opt.value)}
                        className="w-4 h-4 text-amber-700 focus:ring-amber-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-900">
                        {opt.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal pl-6">
                      {opt.desc}
                    </p>
                  </label>
                );
              })}
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Thứ tự ưu tiên hiển thị (Display Order)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-32 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-amber-500 transition font-mono"
                />
                <span className="text-xs text-slate-500">
                  Số nhỏ hơn sẽ được ưu tiên xuất hiện trước trên thanh Timeline và bộ lọc.
                </span>
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
        { label: 'CMS', href: APP_ROUTES.DASHBOARD },
        { label: 'Chương trình học', href: APP_ROUTES.CURRICULUM },
        { label: 'Thời kỳ lịch sử', href: APP_ROUTES.PERIODS.LIST },
        {
          label: isEdit
            ? `Chỉnh sửa: ${name || 'Thời kỳ'}`
            : 'Tạo mới thời kỳ lịch sử',
        },
      ]}
      title={isEdit ? (name ? `Chỉnh sửa thời kỳ: ${name}` : 'Chỉnh sửa thời kỳ') : 'Tạo mới thời kỳ lịch sử'}
      subtitle="Quản lý niên đại kỷ nguyên, cây phân cấp giai đoạn con và danh mục chủ đề học tập trực thuộc."
      recordId={periodId}
      status={status}
      savingAction={savingAction}
      onSaveDraft={() => handleSave(ContentStatus.DRAFT)}
      onPublish={() => handleSave(ContentStatus.PUBLISHED)}
      onCancel={() => router.push(APP_ROUTES.PERIODS.LIST)}
      sections={sections}
      activeSectionIndex={activeStepIndex}
      onActiveSectionIndexChange={setActiveStepIndex}
      navigationLayout="HORIZONTAL_STEPPER"
      hideHeaderPublish={true}
      banner={
        <EditorRevisionBanner
          type="PERIOD"
          contentId={periodId}
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
