'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { ActionMenu, ConfirmDeleteModal } from '@/components/common/CommonUi';

export interface TagFormData {
  name: string;
  description?: string;
  colorHex?: string;
}

export interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TagFormData) => void;
  initialData?: ({ id: string } & TagFormData) | null;
  errorMessage?: string | null;
}

const TAG_COLOR_PRESETS = [
  '#8C2D19',
  '#B8860B',
  '#2E6B56',
  '#1D4ED8',
  '#6D28D9',
  '#B45309',
  '#334155',
  '#0F766E',
] as const;

const DEFAULT_TAG_COLOR = '#B8860B';

export function TagModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  errorMessage,
}: TagModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [colorHex, setColorHex] = useState(initialData?.colorHex || DEFAULT_TAG_COLOR);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isOpen) {
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
        setColorHex(initialData?.colorHex || DEFAULT_TAG_COLOR);
      }
    });
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      colorHex: colorHex || DEFAULT_TAG_COLOR,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initialData ? 'Chỉnh sửa thẻ' : 'Thêm thẻ mới'}
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{initialData ? 'Chỉnh sửa thẻ' : 'Thêm thẻ mới'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>
              Tên thẻ <b>*</b>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Kháng chiến, Pháp, Địa danh"
              required
            />
          </label>
          <label className="field">
            <span>Mô tả</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả ngắn về thẻ..."
            />
          </label>
          <div className="field">
            <span>Màu nhận diện thẻ</span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {TAG_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColorHex(hex)}
                  aria-label={`Chọn màu ${hex}`}
                  title={hex}
                  className={`size-6 rounded-full border-2 transition cursor-pointer ${
                    colorHex.toLowerCase() === hex.toLowerCase()
                      ? 'scale-110 border-slate-900 ring-2 ring-slate-300'
                      : 'border-white shadow-xs hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <label className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="font-mono">{colorHex.toUpperCase()}</span>
              </label>
            </div>
          </div>
          {errorMessage ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              {initialData ? 'Cập nhật thẻ' : 'Lưu thẻ mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { IconName } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { TagApiService } from '@/services/entities/topic.service';
import { TagItem } from '@/types/models';

export type TagRow = TagItem;

const TAG_PAGE_SIZE = 25;

export function TagList() {
  const [tagsList, setTagsList] = useState<TagRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagRow | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchTags = async (targetPage = page, targetSearch = debouncedQuery) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await TagApiService.getTagsPaginated({
        page: targetPage,
        limit: TAG_PAGE_SIZE,
        search: targetSearch || undefined,
      });
      setTagsList(res.items);
      setTotal(res.total);
      setTotalPages(Math.max(1, res.totalPages || Math.ceil(res.total / TAG_PAGE_SIZE)));
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Không tải được danh sách thẻ.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchTags(page, debouncedQuery);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery]);

  const handleSaveTag = async (data: TagFormData) => {
    setSaveError(null);
    try {
      if (editingTag) await TagApiService.updateTag(editingTag.id, data);
      else await TagApiService.createTag(data);
      setIsModalOpen(false);
      setEditingTag(null);
      await fetchTags(page, debouncedQuery);
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Lưu thẻ thất bại.'));
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    setActionError(null);
    try {
      await TagApiService.deleteTag(deletingTag.id);
      await fetchTags(page, debouncedQuery);
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Xoá thẻ thất bại.'));
    } finally {
      setDeletingTag(null);
    }
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * TAG_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * TAG_PAGE_SIZE, total);

  return (
    <div className="panel management-panel">
      <div className="toolbar">
        <label className="search-box">
          <Icon name={IconName.SEARCH} size={15} className="text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm thẻ phân loại..."
            className="text-slate-800 placeholder:text-slate-500 font-medium text-xs sm:text-sm"
          />
        </label>
        <button
          type="button"
          className="primary-button !h-9 !px-3.5 !text-xs sm:!text-sm font-bold ml-auto"
          onClick={() => {
            setEditingTag(null);
            setIsModalOpen(true);
          }}
        >
          <Icon name={IconName.PLUS} size={15} />
          Thêm thẻ mới
        </button>
      </div>

      {actionError ? (
        <div className="mx-4 my-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
      ) : null}

      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th className="check-col">
                <input type="checkbox" />
              </th>
              <th>TÊN THẺ</th>
              <th>MÔ TẢ</th>
              <th>ĐANG DÙNG</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                  Đang tải danh sách thẻ...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }} className="text-red-700">
                  {loadError}{' '}
                  <button type="button" className="underline font-semibold" onClick={() => fetchTags()}>
                    Thử lại
                  </button>
                </td>
              </tr>
            ) : tagsList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                  Không tìm thấy thẻ nào phù hợp.
                </td>
              </tr>
            ) : (
              tagsList.map((tag) => (
                <tr key={tag.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: tag.colorHex || '#d7a736',
                          display: 'inline-block',
                        }}
                      />
                      <strong className="text-slate-900 text-sm font-semibold">{tag.name}</strong>
                    </div>
                  </td>
                  <td className="text-slate-700 text-xs sm:text-sm">{tag.description || 'Chưa có mô tả'}</td>
                  <td className="text-slate-700 text-xs sm:text-sm font-medium">
                    <span>{tag._count?.lessonTags ?? 0} bài học · </span>
                    {(tag._count?.articleTags ?? 0) > 0 ? (
                      <a
                        href={`/bai-viet?tag=${encodeURIComponent(tag.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#7A1F24] hover:underline"
                        title={`Xem ${tag._count?.articleTags} bài viết gắn thẻ ${tag.name}`}
                      >
                        {tag._count?.articleTags} bài viết ↗
                      </a>
                    ) : (
                      <span>0 bài viết</span>
                    )}
                  </td>
                  <td>
                    <ActionMenu
                      onEdit={() => {
                        setEditingTag(tag);
                        setIsModalOpen(true);
                      }}
                      onDelete={() => setDeletingTag(tag)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="text-xs sm:text-sm text-slate-700 font-medium">
          {total === 0
            ? 'Hiển thị 0 thẻ'
            : `Hiển thị ${rangeStart}–${rangeEnd} trong ${total} thẻ`}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="disabled:opacity-40"
          >
            Trước
          </button>
          <span className="px-2 text-xs font-semibold text-slate-700">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>

      <TagModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTag(null);
          setSaveError(null);
        }}
        onSave={handleSaveTag}
        initialData={editingTag}
        errorMessage={saveError}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingTag}
        onClose={() => setDeletingTag(null)}
        onConfirm={handleDeleteTag}
        title={deletingTag?.name || ''}
        itemTypeLabel="thẻ"
      />
    </div>
  );
}
