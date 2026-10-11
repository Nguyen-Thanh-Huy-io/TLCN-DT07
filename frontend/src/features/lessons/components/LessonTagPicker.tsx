'use client';
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

export function LessonTagPicker({
  selectedTags,
  onChange,
  disabled = false,
}: LessonTagPickerProps) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Tải danh sách nhãn khi mở dropdown hoặc mount
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

  // Lọc nhãn theo từ khóa tìm kiếm
  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allTags.filter((t) => {
      const matchName = !query || t.name.toLowerCase().includes(query);
      const notSelected = !selectedTags.some((s) => s.id === t.id);
      return matchName && notSelected;
    });
  }, [allTags, search, selectedTags]);

  const exactMatchExists = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allTags.some((t) => t.name.toLowerCase() === query);
  }, [allTags, search]);

  const handleSelectTag = (tag: TagItem) => {
    onChange([...selectedTags, tag]);
    setSearch('');
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateNewTag = async () => {
    const name = search.trim();
    if (!name) return;

    try {
      setCreating(true);
      const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
      const created = await TagApiService.createTag({
        name,
        colorHex: randomColor,
      });
      setAllTags((prev) => [created, ...prev]);
      onChange([...selectedTags, created]);
      setSearch('');
    } catch (err) {
      console.error('Failed to create tag:', err);
      alert(extractErrorMessage(err, 'Không thể tạo thẻ mới.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <Icon name={IconName.TAG} size={12} className="text-slate-500" />
          <span>Thẻ phân loại (Tags)</span>
        </label>
        <span className="text-[10px] text-slate-400 font-medium">
          {selectedTags.length > 0 ? `${selectedTags.length} thẻ` : 'Tùy chọn'}
        </span>
      </div>

      {/* Danh sách thẻ đã chọn */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/80 border border-slate-200 rounded-lg">
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

      {/* Ô tìm kiếm & Chọn thẻ */}
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

        {/* Dropdown danh sách gợi ý */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto p-1 text-xs">
            {loading ? (
              <div className="p-2 text-center text-slate-400 text-[11px]">Đang tải danh sách thẻ...</div>
            ) : (
              <>
                {filteredTags.length > 0 ? (
                  <div className="space-y-0.5">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-100 text-left transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: tag.colorHex || '#3B82F6' }}
                          />
                          <span className="text-slate-800 font-medium truncate">{tag.name}</span>
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

                {/* Tùy chọn tạo nhanh thẻ mới nếu chưa tồn tại */}
                {search.trim() && !exactMatchExists && (
                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      type="button"
                      disabled={creating}
                      onClick={handleCreateNewTag}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-blue-50 text-blue-600 font-semibold text-left transition cursor-pointer"
                    >
                      <Icon name={IconName.PLUS} size={12} />
                      <span className="truncate">
                        {creating ? 'Đang tạo...' : `Tạo thẻ mới: "${search.trim()}"`}
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
