'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { TagModal, TagFormData } from './TagModal';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { ActionMenu } from '@/components/common/ActionMenu';
import { IconName } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { TagApiService } from '@/services/entities/tag.service';
import { TagItem } from '@/types/models';

export type TagRow = TagItem;

export function TagList() {
  const [tagsList, setTagsList] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagRow | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTagsList(await TagApiService.getTags());
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Không tải được danh sách thẻ.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchTags();
    });
  }, []);

  const handleSaveTag = async (data: TagFormData) => {
    setSaveError(null);
    try {
      if (editingTag) await TagApiService.updateTag(editingTag.id, data);
      else await TagApiService.createTag(data);
      setIsModalOpen(false);
      setEditingTag(null);
      await fetchTags();
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Lưu thẻ thất bại.'));
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    setActionError(null);
    try {
      await TagApiService.deleteTag(deletingTag.id);
      setTagsList((prev) => prev.filter((t) => t.id !== deletingTag.id));
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Xoá thẻ thất bại.'));
    } finally {
      setDeletingTag(null);
    }
  };

  const filteredTags = tagsList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            ) : filteredTags.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                  Không tìm thấy thẻ nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredTags.map((tag) => (
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
                    {tag._count?.lessonTags ?? 0} bài học · {tag._count?.articleTags ?? 0} bài viết
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
        <span className="text-xs sm:text-sm text-slate-700 font-medium">Hiển thị 1–{filteredTags.length} trong {filteredTags.length} thẻ</span>
        <div>
          <button type="button" className="selected">1</button>
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
