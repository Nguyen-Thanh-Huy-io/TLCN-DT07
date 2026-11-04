'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { TagModal, TagFormData } from './TagModal';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { ActionMenu } from '@/components/common/ActionMenu';
import { IconName } from '@/constants/icons';
import api from '@/services/api';
import { TagItem } from '@/types/models/tag.type';

export type TagRow = TagItem;

export function TagList() {
  const [tagsList, setTagsList] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagRow | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tags');
      const payload = res.data?.items || res.data?.data || res.data || [];
      // Danh sách rỗng là trạng thái hợp lệ — không thay bằng dữ liệu mẫu giả.
      setTagsList(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setTagsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSaveTag = async (data: TagFormData) => {
    try {
      if (editingTag) {
        await api.patch(`/tags/${editingTag.id}`, data);
        setTagsList((prev) =>
          prev.map((t) => (t.id === editingTag.id ? { ...t, ...data } : t))
        );
      } else {
        const res = await api.post('/tags', data);
        const newTag = res.data?.data || res.data || { id: `tag-${Date.now()}`, ...data };
        setTagsList((prev) => [newTag, ...prev]);
      }
      setIsModalOpen(false);
      setEditingTag(null);
    } catch (err) {
      console.error('Save tag failed:', err);
      // Fallback local update
      if (editingTag) {
        setTagsList((prev) =>
          prev.map((t) => (t.id === editingTag.id ? { ...t, ...data } : t))
        );
      } else {
        setTagsList((prev) => [{ id: `tag-${Date.now()}`, ...data, lessonCount: 0 }, ...prev]);
      }
      setIsModalOpen(false);
      setEditingTag(null);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    try {
      await api.delete(`/tags/${deletingTag.id}`);
      setTagsList((prev) => prev.filter((t) => t.id !== deletingTag.id));
    } catch (err) {
      console.error('Delete tag failed:', err);
      setTagsList((prev) => prev.filter((t) => t.id !== deletingTag.id));
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

      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th className="check-col">
                <input type="checkbox" />
              </th>
              <th>TÊN THẺ</th>
              <th>MÔ TẢ</th>
              <th>SỐ BÀI HỌC</th>
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
                  <td className="text-slate-700 text-xs sm:text-sm font-medium">{tag.lessonCount ?? 0} bài học</td>
                  <td>
                    <ActionMenu
                      onEdit={() => {
                        setEditingTag(tag);
                        setIsModalOpen(true);
                      }}
                      onDelete={() => setDeletingTag(tag)}
                      onView={() => alert(`Xem thẻ: ${tag.name}`)}
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
        }}
        onSave={handleSaveTag}
        initialData={editingTag}
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
