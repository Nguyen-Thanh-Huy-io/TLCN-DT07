'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import api, { extractErrorMessage } from '@/services/api';
import { formatTimeAgo } from '@/utils/time-ago.util';

export interface MediaFileItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  sizeBytes: number;
  uploadedAt: string;
  dimensions?: string;
  tags?: string[];
}

const MEDIA_STORAGE_KEY = 'hisgo_uploaded_media_library';

export function MediaManagerView() {
  const [mediaList, setMediaList] = useState<MediaFileItem[]>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaFileItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MediaFileItem | null>(null);
  const [editNameInput, setEditNameInput] = useState('');

  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      const matchType = filterType === 'all' || item.type === filterType;
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [mediaList, filterType, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = response.data?.url || response.data?.filePath || URL.createObjectURL(file);

      const newItem: MediaFileItem = {
        id: `media-${Date.now()}`,
        name: file.name,
        url: uploadedUrl,
        type: file.type.startsWith('video/') ? 'video' : file.type.includes('pdf') ? 'document' : 'image',
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        tags: ['Mới tải lên'],
      };

      setMediaList((prev) => {
        const next = [newItem, ...prev];
        try {
          localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err: unknown) {
      setUploadError(extractErrorMessage(err, 'Không thể tải lên tư liệu media.'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyLink = (item: MediaFileItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openRenameModal = (item: MediaFileItem) => {
    setEditingItem(item);
    setEditNameInput(item.name);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingItem) return;
    const trimmed = editNameInput.trim();
    if (!trimmed) return;

    setMediaList((prev) => {
      const next = prev.map((item) =>
        item.id === editingItem.id ? { ...item, name: trimmed } : item
      );
      try {
        localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (previewMedia?.id === editingItem.id) {
      setPreviewMedia((prev) => (prev ? { ...prev, name: trimmed } : null));
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tệp tư liệu này khỏi thư viện?')) {
      setMediaList((prev) => {
        const next = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      if (previewMedia?.id === id) setPreviewMedia(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Thanh công cụ và thống kê */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên tệp hoặc từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Icon name={IconName.SEARCH} size={15} />
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'image', 'video', 'document'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filterType === type
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'all' && 'Tất cả'}
                {type === 'image' && 'Hình ảnh'}
                {type === 'video' && 'Video'}
                {type === 'document' && 'Tài liệu'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-sm font-semibold transition-colors shadow-2xs">
            <Icon name={IconName.PLUS} size={15} />
            <span>{uploading ? 'Đang tải lên...' : 'Tải tư liệu mới'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept="image/*,video/*,application/pdf"
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="text-red-500 font-bold">×</button>
        </div>
      )}

      {/* Grid danh sách tư liệu */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Icon name={IconName.IMAGE} size={32} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Chưa có tệp tư liệu nào</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Hãy tải lên các hình ảnh di tích, chân dung nhân vật hoặc tài liệu lịch sử để nhúng vào bài giảng.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              {/* Media Preview Box */}
              <div
                className="relative h-44 bg-slate-100 flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => setPreviewMedia(item)}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : item.type === 'video' ? (
                  <div className="flex flex-col items-center text-slate-500">
                    <Icon name={IconName.VIDEO} size={36} />
                    <span className="text-xs mt-1 font-medium">Video tư liệu</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <Icon name={IconName.FILE} size={36} />
                    <span className="text-xs mt-1 font-medium">Văn bản / PDF</span>
                  </div>
                )}

                <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                  {item.type}
                </div>
              </div>

              {/* Thông tin & Tác vụ */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    className="text-xs font-semibold text-slate-800 truncate"
                    title={item.name}
                  >
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{formatSize(item.sizeBytes)}</span>
                    <span>{formatTimeAgo(item.uploadedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(item)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Icon name={IconName.SPARK} size={12} />
                    <span>{copiedId === item.id ? 'Đã chép URL' : 'Sao chép link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openRenameModal(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Đổi tên lưu trữ"
                  >
                    <Icon name={IconName.EDIT} size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Xóa tệp"
                  >
                    <Icon name={IconName.TRASH} size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal xem trước */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 truncate max-w-md">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {previewMedia.name}
                </h3>
                <button
                  type="button"
                  onClick={() => openRenameModal(previewMedia)}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Đổi tên tư liệu"
                >
                  <Icon name={IconName.EDIT} size={15} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
              >
                ×
              </button>
            </div>

            <div className="py-4 flex justify-center bg-slate-50 rounded-xl my-4 max-h-[60vh] overflow-hidden">
              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.name}
                  className="max-h-[55vh] object-contain rounded-lg"
                />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-600">Đường dẫn tệp tư liệu:</p>
                  <code className="text-xs bg-slate-200 px-3 py-1.5 rounded mt-2 block break-all text-slate-800">
                    {previewMedia.url}
                  </code>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Kích thước: {formatSize(previewMedia.sizeBytes)} &bull; {previewMedia.dimensions || 'Tư liệu số'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyLink(previewMedia)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                {copiedId === previewMedia.id ? 'Đã sao chép link!' : 'Sao chép đường dẫn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal đổi tên tệp lưu trữ */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Đổi tên tư liệu lưu trữ
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên hiển thị / Gợi nhớ
                </label>
                <input
                  type="text"
                  autoFocus
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="Nhập tên tệp tư liệu..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tên này sẽ hiển thị trong thư viện media và giúp bạn dễ tìm kiếm khi soạn bài giảng.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!editNameInput.trim()}
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
