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

const DEFAULT_TAGS: TagRow[] = [
  { id: 'tag-1', name: 'Kháng chiến', description: 'Các cuộc kháng chiến bảo vệ Tổ quốc', lessonCount: 18, colorHex: '#2563eb' },
  { id: 'tag-2', name: 'Nhân vật lịch sử', description: 'Các anh hùng, danh nhân dân tộc', lessonCount: 32, colorHex: '#16a34a' },
  { id: 'tag-3', name: 'Địa danh', description: 'Chiến trường, di tích lịch sử', lessonCount: 24, colorHex: '#d97706' },
  { id: 'tag-4', name: 'Chiến dịch', description: 'Các chiến dịch quân sự lớn', lessonCount: 15, colorHex: '#dc2626' },
];

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
      const list = Array.isArray(payload) ? payload : [];
      setTagsList(list.length > 0 ? list : DEFAULT_TAGS);
    } catch (err) {
      console.error('Failed to load tags, using fallback:', err);
      setTagsList(DEFAULT_TAGS);
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
          <Icon name={IconName.SEARCH} size={17} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm thẻ phân loại..."
          />
        </label>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setEditingTag(null);
            setIsModalOpen(true);
          }}
        >
          <Icon name={IconName.PLUS} size={17} />
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
                      <strong>{tag.name}</strong>
                    </div>
                  </td>
                  <td>{tag.description || 'Chưa có mô tả'}</td>
                  <td>{tag.lessonCount ?? 0} bài học</td>
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
        <span>Hiển thị 1–{filteredTags.length} trong {filteredTags.length} thẻ</span>
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
