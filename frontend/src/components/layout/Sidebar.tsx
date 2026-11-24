'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { Icon } from '@/components/icons/Icon';
import { Logo } from '@/components/common/CommonUi';
import { Avatar } from '@/components/common/CommonUi';
import { IconName } from '@/constants/enums';
import { navigationFacade } from '@/services/navigation/navigation-strategy.service';
import { NavGroupConfig, NavItemConfig } from '@/constants/ui-theme';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { PublicAuthService, USER_ROLE_LABELS } from '@/services/auth/public-auth.service';
import { canAccessCmsPage } from '@/components/layout/ClientLayout';

export interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
  open: boolean;
  close: () => void;
  collapsed?: boolean;
  toggleCollapse?: () => void;
}

export function Sidebar({
  page,
  setPage,
  open,
  close,
  collapsed = false,
  toggleCollapse,
}: SidebarProps) {
  const router = useRouter();
  const user = useAuthSession();
  // Ẩn mục menu mà vai trò hiện tại không vào được (vd. biên tập viên không thấy Duyệt bài).
  const navGroups: NavGroupConfig[] = useMemo(
    () =>
      navigationFacade
        .getNavGroups()
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => canAccessCmsPage(item.page, user?.role)),
        }))
        .filter((group) => group.items.length > 0),
    [user?.role],
  );
  const displayName = user?.username || user?.email || '';

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Tự động mở rộng nhóm chứa mục đang active khi chuyển trang
  useEffect(() => {
    const activeKey = navigationFacade.resolveActiveSidebarPage(page);
    const activeGroup = navGroups.find((g) =>
      g.items.some((item) => item.page === activeKey),
    );
    if (!activeGroup) return;
    void Promise.resolve().then(() =>
      setCollapsedGroups((prev) => (prev[activeGroup.id] ? { ...prev, [activeGroup.id]: false } : prev)),
    );
  }, [page, navGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? 'show' : ''}`}
        onClick={close}
      />
      <aside
        className={`sidebar ${open ? 'sidebar-open' : ''} ${
          collapsed ? 'sidebar-is-collapsed' : ''
        }`}
      >
        <div className="sidebar-head">
          <Logo collapsed={collapsed} />
          <div className="sidebar-head-actions">
            {toggleCollapse && (
              <button
                type="button"
                className="collapse-toggle-btn"
                onClick={toggleCollapse}
                title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
                aria-label={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
              >
                <Icon
                  name={collapsed ? IconName.CHEVRON : IconName.CHEVRON_LEFT}
                  size={14}
                />
              </button>
            )}
            <button
              type="button"
              className="mobile-close lg:hidden"
              onClick={close}
              aria-label="Đóng menu"
            >
              ×
            </button>
          </div>
        </div>

        <nav className="custom-scrollbar">
          {navGroups.map((group) => {
            const isGroupCollapsed = Boolean(collapsedGroups[group.id]);
            return (
              <div className="nav-group" key={group.id}>
                {!collapsed ? (
                  <button
                    type="button"
                    className="nav-group-header"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isGroupCollapsed}
                    title={
                      isGroupCollapsed
                        ? `Mở rộng nhóm ${group.label}`
                        : `Thu gọn nhóm ${group.label}`
                    }
                  >
                    <p>{group.label}</p>
                    <span
                      className={`nav-group-chevron ${
                        isGroupCollapsed ? 'collapsed' : ''
                      }`}
                    >
                      <Icon name={IconName.CHEVRON} size={11} />
                    </span>
                  </button>
                ) : (
                  <div className="nav-group-divider" title={group.label} />
                )}

                {(!isGroupCollapsed || collapsed) && (
                  <div className="nav-group-items">
                    {group.items.map((item: NavItemConfig) => {
                      const activeKey =
                        navigationFacade.resolveActiveSidebarPage(page);
                      const isActive = activeKey === item.page;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`nav-item ${isActive ? 'active' : ''} ${
                            collapsed ? 'nav-item-collapsed' : ''
                          }`}
                          onClick={() => {
                            setPage(item.page);
                            close();
                          }}
                          title={`${item.label} ${
                            item.subtitle ? `(${item.subtitle})` : ''
                          }`}
                        >
                          <Icon name={item.icon} size={16} />
                          {!collapsed && <span>{item.label}</span>}
                          {!collapsed && item.badgeCount ? (
                            <em>{item.badgeCount}</em>
                          ) : null}
                          {collapsed && item.badgeCount ? (
                            <i className="nav-collapsed-badge-dot" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          className={`sidebar-user ${
            collapsed ? 'sidebar-user-collapsed' : ''
          }`}
        >
          <Avatar text={displayName.slice(0, 2).toUpperCase()} small />
          {!collapsed && (
            <div>
              <strong>{displayName}</strong>
              <span>{user ? USER_ROLE_LABELS[user.role] ?? user.role : ''}</span>
            </div>
          )}
          <button
            type="button"
            title="Đăng xuất"
            onClick={async () => {
              await PublicAuthService.logout();
              router.replace(APP_ROUTES.LOGIN);
            }}
          >
            <Icon name={IconName.LOGOUT} size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}

// --- Merged from PageHeader.tsx ---
export interface PageHeaderInfo {
  title: string;
  subtitle: string;
  eyebrow?: {
    parentLabel: string;
    parentRoute: string;
    currentText: string;
  };
}

const STATIC_PAGE_HEADERS: Record<string, PageHeaderInfo> = {
  [APP_ROUTES.DASHBOARD]: { title: 'Tổng quan', subtitle: 'Quản lý nội dung học tập và chỉ số vận hành trên HISGO' },
  [APP_ROUTES.CMS]: { title: 'Tổng quan', subtitle: 'Việc cần làm của bạn và tình trạng kho nội dung' },
  [APP_ROUTES.CURRICULUM]: { title: 'Chương trình học', subtitle: 'Cấu trúc phân cấp: Chủ đề ➔ Bài học & Quiz, và Lộ trình ➔ Chương ➔ Bài học' },
  [APP_ROUTES.TOPICS.CREATE]: {
    title: 'Thêm chủ đề mới',
    subtitle: 'Tạo chuyên đề học tập thuộc giai đoạn lịch sử',
    eyebrow: { parentLabel: 'Cây phân cấp Chủ đề', parentRoute: APP_ROUTES.CURRICULUM, currentText: 'Tạo mới' },
  },
  [APP_ROUTES.LESSONS.CREATE]: {
    title: 'Tạo bài học mới',
    subtitle: 'Soạn thảo nội dung bài giảng và câu hỏi kiểm tra',
    eyebrow: { parentLabel: 'Bài học & Quiz', parentRoute: APP_ROUTES.CURRICULUM, currentText: 'Tạo mới' },
  },
  [APP_ROUTES.ARTICLES.LIST]: { title: 'Bài viết', subtitle: 'Nhân vật, sự kiện, di tích, triều đại… — mỗi bài thuộc 1 chuyên mục, gắn nhiều tag' },
  [APP_ROUTES.TIMELINES.LIST]: { title: 'Dòng thời gian', subtitle: 'Dựng trình tự các mốc lịch sử; mốc có thể trỏ tới bài viết' },
  [APP_ROUTES.CATEGORIES]: { title: 'Chuyên mục', subtitle: 'Bài viết thuộc loại gì — quyết định trang công khai hiển thị bài (/chuyen-muc/…)' },
  [APP_ROUTES.TAGS.LIST]: { title: 'Tag', subtitle: 'Từ khoá gắn bài viết và bài học để tìm kiếm, gợi ý bài liên quan' },
  [APP_ROUTES.REVIEW]: { title: 'Hàng chờ duyệt', subtitle: 'Mọi việc cần duyệt ở một nơi: bản sửa, bài viết, bài học, blog, báo cáo cộng đồng' },
  [APP_ROUTES.USERS]: { title: 'Người dùng & Quyền', subtitle: 'Quản lý tài khoản biên tập viên và phân quyền hệ thống' },
  [APP_ROUTES.GAMIFICATION]: { title: 'Gamification & Huy hiệu', subtitle: 'Quản lý danh mục huy hiệu thành tựu và theo dõi nhịp học viên' },
  [APP_ROUTES.QUIZZES]: { title: 'Đề thi & Ngân hàng câu hỏi', subtitle: 'Soạn câu hỏi theo chủ đề và ghép thành đề thi có chấm điểm' },
};

const DETAIL_HEADERS = [
  { list: APP_ROUTES.ARTICLES.LIST, create: APP_ROUTES.ARTICLES.CREATE, noun: 'bài viết', crumb: 'Bài viết' },
  { list: APP_ROUTES.TIMELINES.LIST, create: APP_ROUTES.TIMELINES.CREATE, noun: 'dòng thời gian', crumb: 'Dòng thời gian' },
] as const;

export function resolvePageHeader(pathname: string): PageHeaderInfo {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  if (STATIC_PAGE_HEADERS[cleanPath]) return STATIC_PAGE_HEADERS[cleanPath];
  const match = DETAIL_HEADERS.find((d) => cleanPath.startsWith(`${d.list}/`));
  if (match) {
    const isCreate = cleanPath === match.create;
    return {
      title: isCreate ? `Thêm ${match.noun}` : `Chỉnh sửa ${match.noun}`,
      subtitle: isCreate ? 'Lưu nháp được bất cứ lúc nào' : 'Sửa nội dung và trạng thái xuất bản',
      eyebrow: { parentLabel: match.crumb, parentRoute: match.list, currentText: isCreate ? 'Tạo mới' : 'Chỉnh sửa' },
    };
  }
  return { title: 'Quản trị hệ thống', subtitle: 'Hệ thống Quản lý Nội dung HISGO' };
}

export function PageHeader({ pathname }: { pathname: string }) {
  const router = useRouter();
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  if (
    cleanPath === APP_ROUTES.CURRICULUM ||
    cleanPath === APP_ROUTES.LESSONS.CREATE ||
    cleanPath.startsWith('/lessons/') ||
    cleanPath === APP_ROUTES.TOPICS.CREATE ||
    cleanPath.startsWith('/topics/') ||
    cleanPath === APP_ROUTES.ARTICLES.CREATE ||
    cleanPath.startsWith('/articles/')
  ) {
    return null;
  }

  const headerInfo = resolvePageHeader(pathname);

  return (
    <div className="page-title">
      <div>
        {headerInfo.eyebrow && (
          <div className="eyebrow">
            <button type="button" onClick={() => router.push(headerInfo.eyebrow!.parentRoute)}>
              {headerInfo.eyebrow.parentLabel}
            </button>
            <span>/</span>
            <em>{headerInfo.eyebrow.currentText}</em>
          </div>
        )}
        <h1>{headerInfo.title}</h1>
        <p>{headerInfo.subtitle}</p>
      </div>
    </div>
  );
}
