'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import { StatCard } from '@/components/common/CommonUi';
import { DashboardApiService, DashboardOverviewData } from '@/services/entities/dashboard.service';
import { formatTimeAgo } from '@/utils/common';

export function AnalyticsDashboardView() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await DashboardApiService.getOverview();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const counts = data?.counts;
  const distribution = data?.distribution;
  const totalContent =
    (distribution?.published ?? 0) +
    (distribution?.draft ?? 0) +
    (distribution?.pendingReview ?? 0) +
    (distribution?.archived ?? 0) || 1;

  const getPercent = (val?: number) => Math.round(((val ?? 0) / totalContent) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">Thống kê Dữ liệu & Hoạt động Hệ thống</h2>
        <p className="text-xs text-slate-500 mt-1">
          Số liệu thống kê thời gian thực từ cơ sở dữ liệu HISGO: bài học, sự kiện, thời kỳ và nhật ký biên soạn
        </p>
      </div>

      {/* KPI Cards Grid - Dữ liệu thực tế */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IconName.BOOK}
          label="Tổng bài học"
          value={loading ? '...' : String(counts?.lessonsCount ?? 0)}
          detail="Bài giảng trong hệ thống"
        />
        <StatCard
          icon={IconName.CLOCK}
          label="Bài viết"
          value={loading ? '...' : String(counts?.articlesCount ?? 0)}
          detail="Nhân vật, sự kiện, di tích…"
        />
        <StatCard
          icon={IconName.CALENDAR}
          label="Dòng thời gian"
          value={loading ? '...' : String(counts?.timelinesCount ?? 0)}
          detail="Trình tự các mốc lịch sử"
        />
        <StatCard
          icon={IconName.CHECK}
          label="Bài học chờ duyệt"
          value={loading ? '...' : String(counts?.pendingLessonsCount ?? 0)}
          detail="Yêu cầu kiểm duyệt"
        />
      </div>

      {/* Phân bố trạng thái nội dung & Hoạt động thực tế */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phân bố nội dung thực tế */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Phân bố Trạng thái Nội dung</h3>
            <span className="text-xs text-slate-400">Thời gian thực</span>
          </div>

          <div className="space-y-3.5">
            {[
              {
                label: 'Đã xuất bản (Published)',
                count: distribution?.published ?? 0,
                percent: getPercent(distribution?.published),
                color: 'bg-emerald-600',
              },
              {
                label: 'Bản nháp đang soạn (Draft)',
                count: distribution?.draft ?? 0,
                percent: getPercent(distribution?.draft),
                color: 'bg-amber-500',
              },
              {
                label: 'Đang chờ kiểm duyệt (Review)',
                count: distribution?.pendingReview ?? 0,
                percent: getPercent(distribution?.pendingReview),
                color: 'bg-blue-600',
              },
              {
                label: 'Lưu trữ (Archived)',
                count: distribution?.archived ?? 0,
                percent: getPercent(distribution?.archived),
                color: 'bg-slate-400',
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-900">
                    {item.count} bài ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nhật ký hoạt động gần đây */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Hoạt động Gần đây</h3>
            <span className="text-xs text-slate-400">Nhật ký hệ thống</span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 animate-pulse py-8 text-center">
              Đang tải nhật ký hoạt động...
            </p>
          ) : !data?.recentActivities || data.recentActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có hoạt động biên soạn nào gần đây.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 mt-0.5">
                    <Icon name={IconName.SPARK} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {act.authorName || 'Biên tập viên'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      Cập nhật: <strong>{act.title}</strong>
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatTimeAgo(act.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
