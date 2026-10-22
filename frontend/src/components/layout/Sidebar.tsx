'use client';
import React, { useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { Logo } from '@/components/common/Logo';
import { Avatar } from '@/components/common/Avatar';
import { IconName } from '@/constants/icons';
import { navigationFacade } from '@/services/navigation/navigation-strategy.service';
import { NavGroupConfig, NavItemConfig } from '@/constants/navigation';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { PublicAuthService, USER_ROLE_LABELS } from '@/services/auth/public-auth.service';
import { canAccessCmsPage } from '@/components/layout/CmsAccessGate';

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
          {navGroups.map((group) => (
            <div className="nav-group" key={group.id}>
              {!collapsed ? (
                <p>{group.label}</p>
              ) : (
                <div className="nav-group-divider" title={group.label} />
              )}
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
          ))}
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
              window.location.assign('/login');
            }}
          >
            <Icon name={IconName.LOGOUT} size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
