'use client';
import React, { useMemo, useState, useEffect } from 'react';
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

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Tự động mở rộng nhóm chứa mục đang active khi chuyển trang
  useEffect(() => {
    const activeKey = navigationFacade.resolveActiveSidebarPage(page);
    const activeGroup = navGroups.find((g) =>
      g.items.some((item) => item.page === activeKey),
    );
    if (activeGroup && collapsedGroups[activeGroup.id]) {
      setCollapsedGroups((prev) => ({
        ...prev,
        [activeGroup.id]: false,
      }));
    }
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
