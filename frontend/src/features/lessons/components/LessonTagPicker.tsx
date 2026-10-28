'use client';
import { KeyboardKey } from '@/constants/enums';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TagItem } from '@/types/models/tag.type';
import { TagApiService } from '@/services/entities/tag.service';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { extractErrorMessage } from '@/services/api';

export interface LessonTagPickerProps {
  selectedTags: TagItem[];
  onChange: (tags: TagItem[]) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#64748B', // Slate
];

// Danh mục các thẻ cốt lõi gợi ý sẵn (Core Historical Tags)
const CORE_HISTORICAL_TAGS = [
  'Chiến dịch quân sự',
  'Hiệp định & Hòa ước',
  'Phong trào yêu nước',
  'Nhân vật lịch sử',
  'Văn hóa - Xã hội',
  'Kháng chiến chống Pháp',
  'Kháng chiến chống Mỹ',
  'Di tích lịch sử',
];

/**
 * Chuẩn hóa tên thẻ:
 * 1. Cắt khoảng trắng đầu cuối
 * 2. Bỏ tiền tố '#' nếu người dùng quen tay gõ
 * 3. Gộp nhiều khoảng trắng liên tiếp
 * 4. Viết hoa chữ cái đầu (Title case)
 */
function normalizeTagName(input: string): string {
  const cleaned = input
    .trim()
    .replace(/^#+/, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function LessonTagPicker({
  selectedTags,
  onChange,
  disabled = false,
  hideLabel = false,
}: LessonTagPickerProps) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Tải danh sách nhãn khi mount
  useEffect(() => {
    let active = true;
    setLoading(true);
    TagApiService.getTags()
      .then((items) => {
        if (active) setAllTags(items || []);
      })
      .catch((err) => {
        console.error('Failed to load tags:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Chuẩn hóa chuỗi tìm kiếm
  const normalizedQuery = useMemo(() => normalizeTagName(search).toLowerCase(), [search]);

  // Lọc nhãn theo từ khóa tìm kiếm
  const filteredTags = useMemo(() => {
    return allTags.filter((t) => {
      const matchName = !normalizedQuery || t.name.toLowerCase().includes(normalizedQuery);
      const notSelected = !selectedTags.some((s) => s.id === t.id);
      return matchName && notSelected;
    });
  }, [allTags, normalizedQuery, selectedTags]);

  // Kiểm tra xem đã có thẻ trùng tên hoàn toàn (không phân biệt hoa thường)
  const exactMatchingTag = useMemo(() => {
    if (!normalizedQuery) return null;
    return allTags.find((t) => t.name.toLowerCase() === normalizedQuery) || null;
  }, [allTags, normalizedQuery]);

  const exactMatchExists = Boolean(exactMatchingTag);

  const handleSelectTag = (tag: TagItem) => {
    if (!selectedTags.some((s) => s.id === tag.id)) {
      onChange([...selectedTags, tag]);
    }
    setSearch('');
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  // Tạo hoặc chọn thẻ (Cơ chế chống trùng lặp: nếu đã có trong DB thì chọn thay vì tạo mới)
  const handleCreateOrSelectTag = async (customName?: string) => {
    const raw = customName || search;
    const cleanName = normalizeTagName(raw);
    if (!cleanName) return;

    // 1. Nếu đã có thẻ trùng tên trong cơ sở dữ liệu -> Chọn luôn, không tạo thêm
    const existing = allTags.find((t) => t.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      handleSelectTag(existing);
      return;
    }

    // 2. Nếu thực sự chưa có -> Tạo mới
    try {
      setCreating(true);
      const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
      const created = await TagApiService.createTag({
        name: cleanName,
        colorHex: randomColor,
      });
      setAllTags((prev) => [created, ...prev]);
      onChange([...selectedTags, created]);
      setSearch('');
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to create tag:', err);
      alert(extractErrorMessage(err, 'Không thể tạo thẻ mới. Vui lòng thử lại.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {!hideLabel && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Icon name={IconName.TAG} size={12} className="text-slate-500" />
            <span>Thẻ phân loại (Tags)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            {selectedTags.length > 0 ? `${selectedTags.length} thẻ` : 'Tùy chọn'}
          </span>
        </div>
      )}

      {/* Danh sách thẻ đã chọn (Tag Pills tinh gọn) */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all"
              style={{
                backgroundColor: tag.colorHex ? `${tag.colorHex}15` : '#EFF6FF',
                color: tag.colorHex || '#1D4ED8',
                borderColor: tag.colorHex ? `${tag.colorHex}40` : '#BFDBFE',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.colorHex || '#3B82F6' }}
              />
              <span className="max-w-[120px] truncate">{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                disabled={disabled}
                className="hover:opacity-75 text-xs ml-0.5 cursor-pointer leading-none"
                title="Gỡ thẻ"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Ô tìm kiếm & Chọn thẻ (Mỏng nhẹ, gọn gàng) */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === KeyboardKey.ENTER) {
                e.preventDefault();
                if (search.trim()) {
                  if (exactMatchingTag) {
                    handleSelectTag(exactMatchingTag);
                  } else {
                    handleCreateOrSelectTag();
                  }
                }
              }
            }}
            placeholder="Tìm kiếm hoặc tạo thẻ mới..."
            disabled={disabled}
            className="w-full text-xs pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white shadow-2xs"
          />
          <div className="absolute left-2 text-slate-400 pointer-events-none">
            <Icon name={IconName.SEARCH} size={12} />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdown danh sách thẻ & gợi ý - Chỉ xuất hiện khi bấm vào ô tìm kiếm */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto p-1.5 text-xs animate-in fade-in duration-100">
            {loading ? (
              <div className="p-2 text-center text-slate-400 text-[11px]">Đang tải danh sách thẻ...</div>
            ) : (
              <>
                {/* 1. Khu vực gợi ý nhanh các thẻ lịch sử phổ biến (chỉ hiện khi chưa nhập từ khóa tìm kiếm) */}
                {!search.trim() && (
                  <div className="pb-2 mb-1.5 border-b border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 block mb-1">
                      Gợi ý phổ biến:
                    </span>
                    <div className="flex flex-wrap gap-1 px-0.5">
                      {CORE_HISTORICAL_TAGS.map((coreName) => {
                        const isAlreadySelected = selectedTags.some(
                          (s) => s.name.toLowerCase() === coreName.toLowerCase()
                        );
                        if (isAlreadySelected) return null;

                        return (
                          <button
                            key={coreName}
                            type="button"
                            onClick={() => handleCreateOrSelectTag(coreName)}
                            disabled={creating}
                            className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 rounded-md transition cursor-pointer"
                          >
                            + {coreName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Danh sách các thẻ có sẵn trong hệ thống */}
                {filteredTags.length > 0 ? (
                  <div className="space-y-0.5">
                    {!search.trim() && (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 block mb-0.5">
                        Tất cả thẻ ({filteredTags.length}):
                      </span>
                    )}
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-left transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: tag.colorHex || '#3B82F6' }}
                          />
                          <span className="text-slate-800 font-medium truncate text-xs">{tag.name}</span>
                        </div>
                        {tag.lessonCount !== undefined && (
                          <span className="text-[10px] text-slate-400">{tag.lessonCount} bài</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 text-center text-slate-400 text-[11px]">
                    {search ? 'Không tìm thấy thẻ có sẵn phù hợp' : 'Đã chọn hết các thẻ hiện có'}
                  </div>
                )}

                {/* 3. Nút bấm tạo nhanh thẻ mới nếu chưa tồn tại */}
                {search.trim() && !exactMatchExists && (
                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      type="button"
                      disabled={creating}
                      onClick={() => handleCreateOrSelectTag()}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-blue-50 text-blue-600 font-bold text-left transition cursor-pointer"
                    >
                      <Icon name={IconName.PLUS} size={12} />
                      <span className="truncate text-xs">
                        {creating ? 'Đang tạo...' : `Tạo thẻ mới: "${normalizeTagName(search)}"`}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
