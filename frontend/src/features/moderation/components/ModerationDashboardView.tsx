'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import {
  AlertTriangle,
  Ban,
  Bot,
  CheckCircle2,
  ExternalLink,
  Flag,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserX,
} from 'lucide-react';
import { API_BASE_URL } from '@/constants/api-url';
import {
  UserRole,
  UserStatus,
  ModerationActionTakenEnum,
  ModerationResolveActionEnum,
  ModerationSourceEnum,
  ModerationTargetTypeEnum,
} from '@/constants/enums';
import {
  ModerationApi,
  type ModerationReportItem,
  type ModerationResolveAction,
  type ModerationRiskLevel,
  type ModerationStats,
  type ModerationTabKey,
} from '../api';

const SOCKET_URL = API_BASE_URL;

const NOTICE_TONE = {
  OK: 'ok',
  ERROR: 'error',
} as const;

const TABS: Array<{ key: ModerationTabKey; label: string }> = [
  { key: 'pending', label: 'Chờ rà soát' },
  { key: 'auto_hidden', label: 'AI tự động ẩn' },
  { key: 'user_report', label: 'Báo cáo từ Cộng đồng' },
  { key: 'removed', label: 'Đã xác nhận xóa' },
  { key: 'dismissed', label: 'Đã khôi phục / Bác bỏ' },
  { key: 'all', label: 'Tất cả nhật ký' },
];

const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  HISTORICAL_REVISIONISM: {
    label: 'Xuyên tạc lịch sử / Chủ quyền',
    bg: '#FEF2F2',
    text: '#991B1B',
    border: '#FECACA',
  },
  PROFANITY: {
    label: 'Ngôn từ thô tục / Xúc phạm',
    bg: '#FFF1F2',
    text: '#9F1239',
    border: '#FECDD3',
  },
  REGIONAL_DISCRIMINATION: {
    label: 'Kỳ thị / Phân biệt vùng miền',
    bg: '#FFF7ED',
    text: '#9A3412',
    border: '#FED7AA',
  },
  SPAM: {
    label: 'Spam / Quảng cáo / Lừa đảo',
    bg: '#FEFCE8',
    text: '#854D0E',
    border: '#FEF08A',
  },
  USER_FLAGGED: {
    label: 'Thành viên báo cáo',
    bg: '#EFF6FF',
    text: '#1E40AF',
    border: '#BFDBFE',
  },
  NONE: {
    label: 'Cần kiểm tra thủ công',
    bg: '#F8FAFC',
    text: '#475569',
    border: '#E2E8F0',
  },
};

const RISK_STYLES: Record<
  ModerationRiskLevel,
  { label: string; bg: string; text: string; bar: string }
> = {
  CRITICAL: {
    label: 'Nghiêm trọng (Critical)',
    bg: '#FEE2E2',
    text: '#991B1B',
    bar: '#DC2626',
  },
  HIGH: {
    label: 'Rủi ro cao (High)',
    bg: '#FFEDD5',
    text: '#9A3412',
    bar: '#EA580C',
  },
  MEDIUM: {
    label: 'Nghi vấn (Medium)',
    bg: '#FEF3C7',
    text: '#92400E',
    bar: '#D97706',
  },
  LOW: {
    label: 'Cảnh báo nhẹ (Low)',
    bg: '#E0F2FE',
    text: '#075985',
    bar: '#0284C7',
  },
  SAFE: {
    label: 'An toàn (Safe)',
    bg: '#DCFCE7',
    text: '#166534',
    bar: '#16A34A',
  },
};

const ACTION_TAKEN_BADGES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  AUTO_HIDDEN: {
    label: 'AI đã tự động ẩn',
    bg: '#FEE2E2',
    text: '#991B1B',
  },
  NONE: {
    label: 'Đang chờ Admin duyệt',
    bg: '#FEF3C7',
    text: '#92400E',
  },
  CONFIRMED_REMOVED: {
    label: 'Đã xác nhận gỡ bỏ',
    bg: '#F1F5F9',
    text: '#334155',
  },
  DISMISSED: {
    label: 'Đã khôi phục hiển thị',
    bg: '#DCFCE7',
    text: '#166534',
  },
};

export function ModerationDashboardView() {
  const [activeTab, setActiveTab] = useState<ModerationTabKey>('pending');
  const [sourceFilter, setSourceFilter] = useState<'AI_SCAN' | 'USER_REPORT' | ''>('');
  const [riskFilter, setRiskFilter] = useState<ModerationRiskLevel | ''>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'POST' | 'COMMENT' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState<ModerationReportItem[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    total: 0,
    pending: 0,
    autoHidden: 0,
    userReports: 0,
    confirmedRemoved: 0,
    dismissed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [banConfirmItem, setBanConfirmItem] = useState<ModerationReportItem | null>(null);
  const [banNote, setBanNote] = useState('');

  const fetchModerationData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ModerationApi.listReports({
        tab: activeTab,
        source: sourceFilter,
        riskLevel: riskFilter,
        targetType: targetTypeFilter,
        search: searchQuery,
      });
      setItems(response.items || []);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      setNotice({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Không thể tải danh sách kiểm duyệt.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, riskFilter, searchQuery, sourceFilter, targetTypeFilter]);

  useEffect(() => {
    void Promise.resolve().then(() => void fetchModerationData());
  }, [fetchModerationData]);

  // Đồng bộ Socket thời gian thực khi có cảnh báo AI mới hoặc người dùng báo cáo
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('moderation:updated', () => {
      void Promise.resolve().then(() => void fetchModerationData());
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchModerationData]);

  const handleResolve = async (
    report: ModerationReportItem,
    action: ModerationResolveAction,
    note?: string,
  ) => {
    setBusyId(report.id);
    setNotice(null);
    try {
      const res = await ModerationApi.resolveReport(report.id, { action, note });
      const title = report.target?.title || res.targetTitle || 'nội dung';
      if (action === ModerationResolveActionEnum.RESTORE) {
        setNotice({
          tone: NOTICE_TONE.OK,
          text: `Đã khôi phục hiển thị cho "${title}" (xác nhận AI bắt nhầm / bác bỏ báo cáo).`,
        });
      } else if (action === ModerationResolveActionEnum.BAN_USER) {
        setNotice({
          tone: NOTICE_TONE.OK,
          text: `Đã gỡ bỏ "${title}" và khóa tài khoản vi phạm của "${report.target?.author?.username || 'người dùng'}".`,
        });
      } else {
        setNotice({
          tone: NOTICE_TONE.OK,
          text: `Đã xác nhận xóa vi phạm đối với "${title}".`,
        });
      }
      setBanConfirmItem(null);
      setBanNote('');
      await fetchModerationData();
    } catch (err) {
      setNotice({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Không thể thực hiện thao tác kiểm duyệt.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRescan = async (report: ModerationReportItem) => {
    setBusyId(report.id);
    setNotice(null);
    try {
      await ModerationApi.rescanTarget(report.targetType, report.targetId);
      setNotice({
        tone: 'ok',
        text: `Đã chạy lại AI Sentinel để phân tích "${report.target?.title || 'nội dung'}".`,
      });
      await fetchModerationData();
    } catch (err) {
      setNotice({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Không thể quét lại bằng AI.',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Dải chỉ số KPI tổng quan kiểm duyệt */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Chờ rà soát</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{stats.pending}</div>
          <div className="mt-1 text-xs text-slate-500">Cần quyết định từ Kiểm duyệt viên</div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-red-700">
            <span>AI tự động ẩn (Tier 3)</span>
            <Bot size={16} className="text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-900 tabular-nums">{stats.autoHidden}</div>
          <div className="mt-1 text-xs text-red-700">Đã hạ tức thời trên dòng thời gian</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Báo cáo Cộng đồng</span>
            <Flag size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{stats.userReports}</div>
          <div className="mt-1 text-xs text-slate-500">Do thành viên HISGO gắn cờ</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Đã xác nhận gỡ</span>
            <ShieldAlert size={16} className="text-slate-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {stats.confirmedRemoved}
          </div>
          <div className="mt-1 text-xs text-slate-500">Vi phạm đã xử lý dứt điểm</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Đã khôi phục (False +)</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {stats.dismissed}
          </div>
          <div className="mt-1 text-xs text-slate-500">Bài an toàn được mở hiển thị lại</div>
        </div>
      </div>

      {/* Khung bảng điều khiển chính */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Thanh Tab & Nút làm mới */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 pt-4">
          <div className="flex items-center gap-6 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative whitespace-nowrap pb-3.5 text-sm transition-colors ${
                    isActive
                      ? 'font-bold text-red-800'
                      : 'font-medium text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-800" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void fetchModerationData()}
            className="mb-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {/* Thanh bộ lọc chi tiết */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề bài, đoạn trích vi phạm, tác giả..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as 'AI_SCAN' | 'USER_REPORT' | '')}
              aria-label="Lọc theo nguồn phát hiện"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="">Tất cả nguồn quét</option>
              <option value="AI_SCAN">🤖 AI Sentinel tự động</option>
              <option value="USER_REPORT">🚩 Người dùng báo cáo</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as ModerationRiskLevel | '')}
              aria-label="Lọc theo mức độ rủi ro"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="">Tất cả mức độ rủi ro</option>
              <option value="CRITICAL">Critical (Nguy hiểm cao)</option>
              <option value="HIGH">High (Vi phạm rõ)</option>
              <option value="MEDIUM">Medium (Nghi vấn)</option>
              <option value="LOW">Low (Cảnh báo nhẹ)</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value as 'POST' | 'COMMENT' | '')}
              aria-label="Lọc theo loại nội dung"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="">Bài viết & Bình luận</option>
              <option value="POST">Bài viết cộng đồng</option>
              <option value="COMMENT">Bình luận</option>
            </select>
          </div>
        </div>

        {/* Thông báo phản hồi thao tác */}
        {notice && (
          <div
            role="status"
            className={`mx-5 mt-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
              notice.tone === NOTICE_TONE.OK
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-4 text-xs font-semibold underline"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Bảng danh sách báo cáo kiểm duyệt */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-5 pr-3 w-[36%]">Nội dung & Đoạn trích vi phạm</th>
                <th className="px-3 py-3.5 w-[22%]">Phân tích của AI Sentinel</th>
                <th className="px-3 py-3.5 w-[16%]">Tác giả & Lịch sử</th>
                <th className="px-3 py-3.5 w-[12%]">Trạng thái</th>
                <th className="py-3.5 pl-3 pr-5 text-right w-[14%]">Thao tác 1-Click</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Đang tải dữ liệu kiểm duyệt từ AI Sentinel...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Không có bản ghi kiểm duyệt nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                items.map((report) => {
                  const riskStyle = RISK_STYLES[report.riskLevel] || RISK_STYLES.LOW;
                  const statusBadge =
                    ACTION_TAKEN_BADGES[report.actionTaken] || ACTION_TAKEN_BADGES.NONE;
                  const confidencePct =
                    typeof report.aiConfidence === 'number'
                      ? Math.round(report.aiConfidence * 100)
                      : null;
                  const isBusy = busyId === report.id;
                  const author = report.target?.author;
                  const isAuthorBlocked = author?.status === UserStatus.BLOCKED;

                  return (
                    <tr key={report.id} className="align-top transition-colors hover:bg-slate-50/70">
                      {/* Cột 1: Nội dung & đoạn trích */}
                      <td className="py-4 pl-5 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              report.targetType === ModerationTargetTypeEnum.POST
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {report.targetType === ModerationTargetTypeEnum.POST ? 'Bài đăng' : 'Bình luận'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(report.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="mt-1.5 font-bold text-slate-900">
                          {report.target?.slug ? (
                            <Link
                              href={`/blog/${report.target.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 hover:text-red-800 hover:underline"
                            >
                              <span>{report.target.title}</span>
                              <ExternalLink size={13} className="shrink-0 text-slate-400" />
                            </Link>
                          ) : (
                            <span>{report.target?.title || `Nội dung #${report.targetId.slice(0, 8)}`}</span>
                          )}
                        </div>

                        {/* Trích dẫn đoạn văn vi phạm */}
                        {report.matchedExcerpt && (
                          <blockquote className="mt-2 rounded-lg border-l-3 border-red-500 bg-red-50/50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                            <span className="font-semibold text-red-900">Đoạn trích: </span>
                            &ldquo;{report.matchedExcerpt}&rdquo;
                          </blockquote>
                        )}

                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          <span className="font-semibold text-slate-800">Lý do phát hiện: </span>
                          {report.reasonText}
                        </p>
                      </td>

                      {/* Cột 2: Điểm tin cậy AI & Danh mục vi phạm */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          {report.source === ModerationSourceEnum.AI_SCAN ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                              <Sparkles size={11} />
                              <span>AI Sentinel</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-900">
                              <Flag size={11} />
                              <span>
                                Báo cáo bởi {report.reporter?.username || 'Thành viên'}
                              </span>
                            </span>
                          )}

                          <span
                            style={{
                              backgroundColor: riskStyle.bg,
                              color: riskStyle.text,
                            }}
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold"
                          >
                            {riskStyle.label}
                          </span>
                        </div>

                        {confidencePct !== null && (
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-600">Độ tin cậy AI:</span>
                              <span className="font-bold text-slate-900 tabular-nums">
                                {confidencePct}%
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                style={{
                                  width: `${confidencePct}%`,
                                  backgroundColor: riskStyle.bar,
                                }}
                                className="h-full rounded-full"
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {report.categories.map((cat) => {
                            const meta = CATEGORY_LABELS[cat] || CATEGORY_LABELS.NONE;
                            return (
                              <span
                                key={cat}
                                style={{
                                  backgroundColor: meta.bg,
                                  color: meta.text,
                                  borderColor: meta.border,
                                }}
                                className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                              >
                                {meta.label}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Cột 3: Tác giả & Lịch sử vi phạm */}
                      <td className="px-3 py-4">
                        {author ? (
                          <div>
                            <div className="font-semibold text-slate-900">{author.username}</div>
                            <div className="text-xs text-slate-500">{author.email}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                  author.violationCount >= 2
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {author.violationCount} lần vi phạm
                              </span>
                              {isAuthorBlocked && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-red-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                                  <Ban size={10} />
                                  <span>Đã khóa</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Không rõ tác giả</span>
                        )}
                      </td>

                      {/* Cột 4: Trạng thái xử lý */}
                      <td className="px-3 py-4">
                        <span
                          style={{
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.text,
                          }}
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                        >
                          {statusBadge.label}
                        </span>
                        {report.reviewer && (
                          <div className="mt-1.5 text-[11px] text-slate-500">
                            Duyệt bởi: <strong>{report.reviewer.username}</strong>
                          </div>
                        )}
                      </td>

                      {/* Cột 5: Thao tác 1-Click */}
                      <td className="py-4 pl-3 pr-5 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {report.actionTaken !== ModerationActionTakenEnum.CONFIRMED_REMOVED && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleResolve(report, ModerationResolveActionEnum.CONFIRM_REMOVE)}
                              className="inline-flex h-8 w-full max-w-[165px] items-center justify-center gap-1.5 rounded-lg bg-red-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              <span>Xác nhận xóa</span>
                            </button>
                          )}

                          {report.actionTaken !== ModerationActionTakenEnum.DISMISSED && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleResolve(report, ModerationResolveActionEnum.RESTORE)}
                              className="inline-flex h-8 w-full max-w-[165px] items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <RotateCcw size={13} />
                              <span>Khôi phục bài</span>
                            </button>
                          )}

                          {author &&
                            !isAuthorBlocked &&
                            author.role !== UserRole.SUPERADMIN &&
                            author.role !== UserRole.ADMIN && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setBanConfirmItem(report);
                                  setBanNote('');
                                }}
                                className="inline-flex h-8 w-full max-w-[165px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-50"
                              >
                                <UserX size={13} />
                                <span>Cấm tài khoản</span>
                              </button>
                            )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleRescan(report)}
                            className="inline-flex items-center gap-1 pt-1 text-[11px] font-medium text-slate-500 hover:text-slate-900"
                          >
                            <CheckCircle2 size={11} />
                            <span>Quét lại bằng AI</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hộp thoại xác nhận khóa tài khoản tái phạm */}
      {banConfirmItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2.5 text-red-700">
              <UserX size={20} />
              <h3 className="text-lg font-bold">Xác nhận khóa tài khoản vi phạm</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Bạn đang thực hiện khóa tài khoản{' '}
              <strong>{banConfirmItem.target?.author?.username}</strong> và gỡ bỏ vĩnh viễn nội dung
              vi phạm <strong>&ldquo;{banConfirmItem.target?.title}&rdquo;</strong>. Phiên đăng nhập
              của người dùng này sẽ bị thu hồi ngay lập tức.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Ghi chú biên bản xử lý (tùy chọn)
              </label>
              <textarea
                rows={3}
                value={banNote}
                onChange={(e) => setBanNote(e.target.value)}
                placeholder="Nhập lý do khóa tài khoản (ví dụ: Tái phạm xuyên tạc lịch sử / spam nhiều lần)..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setBanConfirmItem(null);
                  setBanNote('');
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={busyId === banConfirmItem.id}
                onClick={() => void handleResolve(banConfirmItem, 'BAN_USER', banNote)}
                className="h-9 rounded-lg bg-red-700 px-4 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                Xác nhận khóa & Gỡ bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
