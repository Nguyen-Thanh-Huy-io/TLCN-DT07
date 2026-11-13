'use client';

import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/constants/api-url';
import { ModerationResolveActionEnum } from '@/constants/enums';
import { ModerationApi, type ModerationReportItem, type ModerationResolveAction, type ModerationRiskLevel, type ModerationStats, type ModerationTabKey } from '../api';

export const SOCKET_URL = API_BASE_URL;

export const NOTICE_TONE = {
  OK: 'ok',
  ERROR: 'error',
} as const;

export function useModerationDashboard() {
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

  return {
    activeTab,
    setActiveTab,
    sourceFilter,
    setSourceFilter,
    riskFilter,
    setRiskFilter,
    targetTypeFilter,
    setTargetTypeFilter,
    searchQuery,
    setSearchQuery,
    items,
    stats,
    loading,
    busyId,
    notice,
    setNotice,
    banConfirmItem,
    setBanConfirmItem,
    banNote,
    setBanNote,
    fetchModerationData,
    handleResolve,
    handleRescan,
  };
}

export type ModerationDashboardFacade = ReturnType<typeof useModerationDashboard>;
