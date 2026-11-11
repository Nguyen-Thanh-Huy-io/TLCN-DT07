import api, { extractErrorMessage } from '@/services/api';

export type ModerationTabKey =
  | 'pending'
  | 'auto_hidden'
  | 'user_report'
  | 'removed'
  | 'dismissed'
  | 'all';

export type ModerationRiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ModerationActionTaken = 'NONE' | 'AUTO_HIDDEN' | 'CONFIRMED_REMOVED' | 'DISMISSED';
export type ModerationResolveAction = 'CONFIRM_REMOVE' | 'RESTORE' | 'BAN_USER';

export interface ModerationReportItem {
  id: string;
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  source: 'AI_SCAN' | 'USER_REPORT';
  riskLevel: ModerationRiskLevel;
  aiConfidence: number | null;
  actionTaken: ModerationActionTaken;
  categories: string[];
  reasonText: string;
  matchedExcerpt: string;
  engine: string;
  adminNote: string | null;
  target: {
    id: string;
    title: string;
    slug: string | null;
    postType: string | null;
    excerpt: string;
    status: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      email: string;
      status: string;
      role: string;
      violationCount: number;
    } | null;
  } | null;
  reporter: { id: string; username: string; email: string } | null;
  reviewer: { id: string; username: string; email: string } | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ModerationStats {
  total: number;
  pending: number;
  autoHidden: number;
  userReports: number;
  confirmedRemoved: number;
  dismissed: number;
}

export interface ModerationListResponse {
  stats: ModerationStats;
  items: ModerationReportItem[];
}

const unwrap = <T,>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T;

export const ModerationApi = {
  async listReports(params?: {
    tab?: ModerationTabKey;
    source?: 'AI_SCAN' | 'USER_REPORT' | '';
    riskLevel?: ModerationRiskLevel | '';
    targetType?: 'POST' | 'COMMENT' | '';
    search?: string;
  }): Promise<ModerationListResponse> {
    const qs = new URLSearchParams();
    if (params?.tab) qs.set('tab', params.tab);
    if (params?.source) qs.set('source', params.source);
    if (params?.riskLevel) qs.set('riskLevel', params.riskLevel);
    if (params?.targetType) qs.set('targetType', params.targetType);
    if (params?.search?.trim()) qs.set('search', params.search.trim());
    const query = qs.toString();

    const res = await api.get(`/moderation/reports${query ? `?${query}` : ''}`);
    return unwrap<ModerationListResponse>(res);
  },

  async resolveReport(
    reportId: string,
    payload: { action: ModerationResolveAction; note?: string },
  ): Promise<{
    success: boolean;
    reportId: string;
    actionTaken: ModerationActionTaken;
    bannedUserId: string | null;
    targetTitle: string;
  }> {
    try {
      const res = await api.patch(`/moderation/reports/${reportId}/resolve`, payload);
      return unwrap(res);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Không thể xử lý báo cáo kiểm duyệt.'));
    }
  },

  async rescanTarget(targetType: 'POST' | 'COMMENT', targetId: string) {
    try {
      const res = await api.post(`/moderation/scan/${targetType}/${targetId}`);
      return unwrap(res);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Không thể quét lại nội dung bằng AI.'));
    }
  },
};
