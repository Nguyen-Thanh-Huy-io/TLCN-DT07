'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Award,
  Flame,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import {
  AdminLearnerSortField,
  CmsGamificationTab,
  LEARNER_SORT_OPTIONS,
  METRIC_TYPE_META,
} from '../../constants/gamification.constants';
import {
  GamificationAdminApiService,
  type AdminAchievementItem,
  type AdminGamificationOverview,
  type AdminLearnerRow,
} from '../../services/gamification.service';
import { AchievementBadgeAvatar } from '../GoalAimModal';
import { AchievementFormModal } from './AchievementFormModal';

function SummaryStatCard({
  icon: Icon,
  label,
  value,
  hint,
  accentClass,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  hint: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3.5">
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${accentClass}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold text-slate-900">{value}</div>
        <div className="text-xs font-bold text-slate-700">{label}</div>
        <div className="text-[11px] text-slate-400 truncate">{hint}</div>
      </div>
    </div>
  );
}

export function GamificationCmsView() {
  const [tab, setTab] = useState<CmsGamificationTab>(CmsGamificationTab.ACHIEVEMENTS);
  const [overview, setOverview] = useState<AdminGamificationOverview | null>(null);
  const [learners, setLearners] = useState<AdminLearnerRow[]>([]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<AdminLearnerSortField>(AdminLearnerSortField.XP);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAchievementItem | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [ov, lr] = await Promise.all([
        GamificationAdminApiService.getOverview(),
        GamificationAdminApiService.listLearners({ q: query || undefined, sortBy, limit: 30 }),
      ]);
      setOverview(ov);
      setLearners(lr);
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Không tải được dữ liệu Gamification CMS.'));
    } finally {
      setLoading(false);
    }
  }, [query, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAll();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadAll]);

  const toggleAchievementActive = async (item: AdminAchievementItem) => {
    setActionError(null);
    try {
      await GamificationAdminApiService.updateAchievement(item.id, {
        isActive: !item.isActive,
      });
      await loadAll();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Không đổi được trạng thái huy hiệu.'));
    }
  };

  const handleDeleteAchievement = async (item: AdminAchievementItem) => {
    setActionError(null);
    try {
      await GamificationAdminApiService.deleteAchievement(item.id);
      await loadAll();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Không xoá được huy hiệu.'));
    }
  };

  const summary = overview?.summary;

  return (
    <div className="space-y-6">
      {/* 1. Thẻ số liệu tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryStatCard
          icon={Flame}
          label="Giữ lửa hôm nay"
          value={summary?.activeStreakTodayCount ?? 0}
          hint={`${summary?.weeklyActiveLearnersCount ?? 0} học viên học tuần này`}
          accentClass="bg-amber-50 text-amber-700 border border-amber-200"
        />
        <SummaryStatCard
          icon={Activity}
          label="Hoạt động 7 ngày"
          value={summary?.activitiesLast7DaysCount ?? 0}
          hint="Bài học, Quiz, Đọc bài, Flashcard"
          accentClass="bg-blue-50 text-blue-700 border border-blue-200"
        />
        <SummaryStatCard
          icon={Target}
          label="Mục tiêu tuần đạt"
          value={`${summary?.completedGoalsCount ?? 0}/${(summary?.completedGoalsCount ?? 0) + (summary?.activeGoalsCount ?? 0)}`}
          hint={`${summary?.activeGoalsCount ?? 0} mục tiêu đang theo dõi`}
          accentClass="bg-emerald-50 text-emerald-700 border border-emerald-200"
        />
        <SummaryStatCard
          icon={Award}
          label="Lượt đạt huy hiệu"
          value={summary?.totalUnlockedBadgesCount ?? 0}
          hint={`${overview?.achievements.length ?? 0} danh hiệu trong kho`}
          accentClass="bg-rose-50 text-[#8B261E] border border-rose-200"
        />
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800"
        >
          {actionError}
        </div>
      )}

      {/* 2. Thanh chuyển Tab + nút Tạo huy hiệu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab(CmsGamificationTab.ACHIEVEMENTS)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              tab === CmsGamificationTab.ACHIEVEMENTS
                ? 'bg-[#8B261E] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award size={14} /> Quản lý Huy hiệu ({overview?.achievements.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setTab(CmsGamificationTab.LEARNERS)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              tab === CmsGamificationTab.LEARNERS
                ? 'bg-[#8B261E] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={14} /> Học viên tích cực ({learners.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
          {tab === CmsGamificationTab.ACHIEVEMENTS && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B261E] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#701D17] cursor-pointer"
            >
              <Plus size={14} /> Tạo huy hiệu mới
            </button>
          )}
        </div>
      </div>

      {/* 3. Bảng Quản lý Huy hiệu hoặc Top Học viên */}
      {tab === CmsGamificationTab.ACHIEVEMENTS ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Huy hiệu</th>
                <th className="px-4 py-3">Điều kiện mở khóa</th>
                <th className="px-4 py-3">Thưởng XP</th>
                <th className="px-4 py-3">Đã đạt</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(overview?.achievements ?? []).map((item) => {
                const meta = METRIC_TYPE_META[item.metricType];
                const lockedDelete = item.unlockedCount > 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <AchievementBadgeAvatar
                          title={item.title}
                          iconKey={item.iconKey}
                          imageUrl={item.imageUrl}
                          sizeClass="size-10"
                          iconSize={17}
                        />
                        <div>
                          <div className="font-bold text-slate-900">{item.title}</div>
                          <div className="font-mono text-[10.5px] text-slate-400">{item.code}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500 max-w-xs line-clamp-1">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {meta.label}: <strong className="text-slate-900">&ge; {item.threshold}</strong> {meta.unit}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-700">+{item.xpReward} XP</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{item.unlockedCount} người</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleAchievementActive(item)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {item.isActive ? 'Đang bật' : 'Đã tắt'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setModalOpen(true);
                          }}
                          title="Chỉnh sửa huy hiệu"
                          aria-label="Chỉnh sửa huy hiệu"
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteAchievement(item)}
                          disabled={lockedDelete}
                          title={
                            lockedDelete
                              ? `Đã có ${item.unlockedCount} người đạt — chỉ có thể tắt hiển thị`
                              : 'Xoá huy hiệu'
                          }
                          aria-label="Xoá huy hiệu"
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {overview && overview.achievements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Chưa có huy hiệu nào trong danh mục.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email học viên…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#8B261E] focus:bg-white"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AdminLearnerSortField)}
              aria-label="Sắp xếp học viên"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#8B261E]"
            >
              {LEARNER_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Cấp bậc &amp; XP</th>
                  <th className="px-4 py-3">Chuỗi ngày / tuần</th>
                  <th className="px-4 py-3">Hoạt động</th>
                  <th className="px-4 py-3">Huy hiệu &amp; Mục tiêu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {learners.map((learner, idx) => (
                  <tr key={learner.userId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-extrabold text-slate-400">#{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{learner.displayName}</div>
                      <div className="text-[11px] text-slate-500">{learner.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#8B261E]">{learner.rankLabel}</div>
                      <div className="text-[11px] font-semibold text-amber-700">{learner.totalXp} XP</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                        <Flame size={13} className={learner.studiedToday ? 'text-amber-600 fill-amber-500' : 'text-slate-400'} />
                        {learner.currentDayStreak} ngày
                      </span>
                      <div className="text-[11px] text-slate-500">
                        Kỷ lục {learner.longestDayStreak} · {learner.currentWeekStreak} tuần
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-bold">{learner.totalActivitiesCount}</span> lượt
                      <div className="text-[11px] text-slate-400">
                        {learner.completedLessonsCount} bài · {learner.passedQuizzesCount} quiz · {learner.readArticlesCount} đọc
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-700">{learner.unlockedBadgesCount} huy hiệu</span>
                      <div className="text-[11px] text-slate-400">{learner.goalsCount} mục tiêu</div>
                    </td>
                  </tr>
                ))}
                {learners.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Chưa có dữ liệu học viên phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <AchievementFormModal
          initial={editingItem}
          onClose={() => setModalOpen(false)}
          onSaved={() => void loadAll()}
        />
      )}
    </div>
  );
}
