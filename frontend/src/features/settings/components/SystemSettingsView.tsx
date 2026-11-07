'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { Badge } from '@/components/common/Badge';

export function SystemSettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'health'>('general');
  const [savedNotice, setSavedNotice] = useState(false);

  // General Settings State
  const [platformName, setPlatformName] = useState('HISGO - Nền tảng Học Lịch sử Tương tác');
  const [defaultQuizPassingScore, setDefaultQuizPassingScore] = useState(80);
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(10);
  const [autoReviewThreshold, setAutoReviewThreshold] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon name={IconName.SETTINGS} size={14} />
          <span>Cấu hình & Quy chuẩn</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'health'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon name={IconName.CHECK} size={14} />
          <span>Trạng thái Hạ tầng & Dịch vụ</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 font-medium">
          Đã lưu thay đổi cấu hình hệ thống thành công!
        </div>
      )}

      {/* Tab 2: Cấu hình chung */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs max-w-3xl">
          <form onSubmit={handleSaveGeneral} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Tên nền tảng hiển thị
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">Xuất hiện trên tiêu đề trang và email thông báo</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Ngưỡng đạt Quiz mặc định (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={defaultQuizPassingScore}
                  onChange={(e) => setDefaultQuizPassingScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Áp dụng khi tạo mới bộ câu hỏi</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Giới hạn dung lượng tải tệp (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxUploadSizeMb}
                  onChange={(e) => setMaxUploadSizeMb(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Tối đa cho mỗi ảnh hoặc tài liệu tư liệu</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReviewThreshold}
                  onChange={(e) => setAutoReviewThreshold(e.target.checked)}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800">
                    Bật chế độ gửi duyệt tự động khi lưu bản hoàn thiện
                  </span>
                  <p className="text-xs text-slate-500">
                    Tự động chuyển bài học sang trạng thái chờ kiểm duyệt khi bài có đủ nội dung và Quiz
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Lưu cấu hình hệ thống
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Trạng thái hạ tầng */}
      {activeTab === 'health' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs max-w-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Trạng thái Kết nối Hệ thống</h3>

          <div className="divide-y divide-slate-100">
            {[
              {
                service: 'NestJS Backend API',
                endpoint: 'http://localhost:5000/api/v1',
                status: 'Sẵn sàng',
                tone: 'ok' as const,
              },
              {
                service: 'PostgreSQL Database',
                endpoint: 'localhost:5433 (Docker container)',
                status: 'Đã kết nối',
                tone: 'ok' as const,
              },
              {
                service: 'Redis Cache & Pub/Sub',
                endpoint: 'localhost:6379 (Active)',
                status: 'Đang hoạt động',
                tone: 'ok' as const,
              },
              {
                service: 'Next.js Frontend Shell',
                endpoint: 'v15.2 (App Router)',
                status: 'Trực tuyến',
                tone: 'ok' as const,
              },
            ].map((srv, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{srv.service}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{srv.endpoint}</p>
                </div>
                <Badge tone={srv.tone}>{srv.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
