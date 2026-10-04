'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { ContentCell } from '@/components/common/ContentCell';
import { UserCell } from '@/components/common/UserCell';
import { QuickAction } from '@/components/common/QuickAction';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import {
  DashboardApiService,
  DashboardOverviewData,
} from '@/services/entities/dashboard.service';

export function DashboardView() {
  const router = useRouter();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadOverview = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await DashboardApiService.getOverview();
      setData(res);
      setLastRefreshed(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const counts = data?.counts ?? {
    periodsCount: 0,
    topicsCount: 0,
    lessonsCount: 0,
    pendingLessonsCount: 0,
    historicalEventsCount: 0,
    totalKnowledgeCount: 0,
  };

  const distribution = data?.distribution ?? {
    published: 0,
    draft: 0,
    pendingReview: 0,
    archived: 0,
    rejected: 0,
  };

  const totalDistributed =
    distribution.published +
    distribution.draft +
    distribution.pendingReview +
    distribution.archived +
    distribution.rejected || 1;

  const publishedPercent = Math.round((distribution.published / totalDistributed) * 100);
  const pendingPercent = Math.round((distribution.pendingReview / totalDistributed) * 100);
  const draftPercent = Math.round((distribution.draft / totalDistributed) * 100);

  return (
    <>
      {/* Utility Bar: Trạng thái hệ thống & Thao tác làm mới */}
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-700">Trực tuyến</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="font-semibold text-slate-800">{counts.totalKnowledgeCount}</strong> đơn vị tri thức
          </span>
          {lastRefreshed ? (
            <span className="hidden text-xs text-slate-400 sm:inline">
              (Cập nhật lúc {lastRefreshed})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={() => loadOverview(true)}
            disabled={loading || refreshing}
          >
            <Icon
              name={IconName.CLOCK}
              size={13}
              className={refreshing ? 'animate-spin' : ''}
            />
            {refreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}
          </button>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="stats-grid">
        <StatCard
          icon={IconName.CLOCK}
          value={loading ? '...' : String(counts.periodsCount)}
          label="Giai đoạn lịch sử"
          detail="Phân chia theo dòng thời gian"
          tone="blue"
        />
        <StatCard
          icon={IconName.FOLDER}
          value={loading ? '...' : String(counts.topicsCount)}
          label="Chủ đề học tập"
          detail="Chủ đề kiến thức trọng tâm"
          tone="gold"
        />
        <StatCard
          icon={IconName.BOOK}
          value={loading ? '...' : String(counts.lessonsCount)}
          label="Bài học lịch sử"
          detail="Bài học đã tạo trong hệ thống"
          tone="green"
        />
        <StatCard
          icon={IconName.CHECK}
          value={loading ? '...' : String(counts.pendingLessonsCount)}
          label="Bài chờ duyệt"
          detail="Cần kiểm duyệt chất lượng"
          tone="orange"
        />
      </section>

      {/* Content Distribution Progress Strip (Utilitarian Metric Bar) */}
      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Phân bổ trạng thái bài học ({counts.lessonsCount} bài)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Xuất bản: <strong className="font-semibold text-slate-800">{distribution.published} ({publishedPercent}%)</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Chờ duyệt: <strong className="font-semibold text-slate-800">{distribution.pendingReview} ({pendingPercent}%)</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              Bản nháp: <strong className="font-semibold text-slate-800">{distribution.draft} ({draftPercent}%)</strong>
            </span>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${publishedPercent}%` }}
            title={`Đã xuất bản: ${distribution.published}`}
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${pendingPercent}%` }}
            title={`Chờ duyệt: ${distribution.pendingReview}`}
          />
          <div
            className="bg-slate-400 transition-all duration-500"
            style={{ width: `${draftPercent}%` }}
            title={`Bản nháp: ${distribution.draft}`}
          />
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="dashboard-grid">
        {/* Cột trái: Bảng nội dung cập nhật gần đây */}
        <div className="panel recent-panel">
          <div className="panel-head">
            <div>
              <h2>Nội dung gần đây</h2>
              <p>Dữ liệu bài học, chủ đề và giai đoạn vừa cập nhật</p>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
            >
              Xem tất cả bài học <Icon name={IconName.ARROW} size={15} />
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>NỘI DUNG</th>
                  <th>LOẠI</th>
                  <th>TRẠNG THÁI</th>
                  <th>NGƯỜI CẬP NHẬT</th>
                  <th>THỜI GIAN</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentActivities && data.recentActivities.length > 0 ? (
                  data.recentActivities.map((item) => {
                    const iconName =
                      item.type === 'LESSON'
                        ? IconName.BOOK
                        : item.type === 'TOPIC'
                        ? IconName.FOLDER
                        : IconName.CLOCK;

                    const typeLabel =
                      item.type === 'LESSON'
                        ? 'Bài học'
                        : item.type === 'TOPIC'
                        ? 'Chủ đề'
                        : 'Giai đoạn';

                    const formattedDate = new Date(item.updatedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });

                    return (
                      <tr key={`${item.type}-${item.id}`}>
                        <td>
                          <ContentCell
                            icon={iconName}
                            title={item.title}
                            sub={`ID: ${item.id.slice(0, 8)}...`}
                          />
                        </td>
                        <td>
                          <span className="text-xs font-medium text-slate-600">
                            {typeLabel}
                          </span>
                        </td>
                        <td>
                          <Badge tone={STATUS_TONE_MAP[item.status] || 'gray'}>
                            {STATUS_LABEL_MAP[item.status] || item.status}
                          </Badge>
                        </td>
                        <td>
                          <UserCell initials={item.authorName.slice(0, 2).toUpperCase()} name={item.authorName} />
                        </td>
                        <td>
                          <span className="text-xs text-slate-500">{formattedDate}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                            onClick={() => router.push(item.route)}
                          >
                            Chi tiết <Icon name={IconName.CHEVRON} size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      Chưa có hoạt động cập nhật nào gần đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột phải: Hàng đợi duyệt & Thao tác nhanh */}
        <div className="right-stack">
          {/* Hàng đợi duyệt bài học */}
          <div className="panel pending-panel">
            <div className="panel-head">
              <div>
                <h2>Bài học chờ duyệt</h2>
                <p>{counts.pendingLessonsCount} bài học đang chờ xử lý</p>
              </div>
              <button
                type="button"
                className="count-pill"
                onClick={() => router.push(APP_ROUTES.REVIEW)}
                title="Đi đến trung tâm duyệt bài"
              >
                {counts.pendingLessonsCount}
              </button>
            </div>

            {data?.pendingLessons && data.pendingLessons.length > 0 ? (
              data.pendingLessons.map((item, i) => (
                <div className="pending-item" key={item.id}>
                  <div className="pending-index">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.topicName}</span>
                    <small>
                      {item.creatorName} · {typeof item.createdAt === 'string' && item.createdAt.includes('T') ? new Date(item.createdAt).toLocaleDateString('vi-VN') : item.createdAt}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`${APP_ROUTES.REVIEW}?id=${item.id}`)}
                    title="Mở bài học để duyệt"
                  >
                    <Icon name={IconName.EYE} size={16} /> Duyệt
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                Không có bài học nào đang chờ duyệt.
              </div>
            )}

            <button
              type="button"
              className="panel-footer"
              onClick={() => router.push(APP_ROUTES.REVIEW)}
            >
              Xem tất cả bài chờ duyệt <Icon name={IconName.ARROW} size={15} />
            </button>
          </div>

          {/* Bảng điều khiển thao tác nhanh */}
          <div className="panel quick-panel">
            <div className="panel-head">
              <div>
                <h2>Thao tác nhanh</h2>
                <p>Khởi tạo dữ liệu kiến thức mới</p>
              </div>
            </div>
            <div className="quick-grid">
              <QuickAction
                icon={IconName.CLOCK}
                label="Quản lý Giai đoạn"
                onClick={() => router.push(APP_ROUTES.PERIODS.LIST)}
              />
              <QuickAction
                icon={IconName.FOLDER}
                label="Quản lý Chủ đề"
                onClick={() => router.push(APP_ROUTES.TOPICS.LIST)}
              />
              <QuickAction
                icon={IconName.BOOK}
                label="Soạn bài học mới"
                primary
                onClick={() => router.push(APP_ROUTES.LESSONS.CREATE)}
              />
              <QuickAction
                icon={IconName.CHECK}
                label="Duyệt bài học"
                onClick={() => router.push(APP_ROUTES.REVIEW)}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
