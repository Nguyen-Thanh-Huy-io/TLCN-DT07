'use client';
import React, { useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { Logo } from '@/components/common/Logo';
import { Avatar } from '@/components/common/Avatar';
import { IconName } from '@/constants/icons';
import {
  navigationFacade,
} from '@/services/navigation/navigation-strategy.service';
import { NavGroupConfig, NavItemConfig } from '@/constants/navigation';

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
  const navGroups: NavGroupConfig[] = useMemo(
    () => navigationFacade.getNavGroups(),
    [],
  );

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? 'show' : ''}`}
        onClick={close}
      />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
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
                <Icon name={collapsed ? IconName.CHEVRON : IconName.CHEVRON_LEFT} size={15} />
              </button>
            )}
            <button
              type="button"
              className="mobile-close"
              onClick={close}
              aria-label="Đóng menu"
            >
              ×
            </button>
          </div>
        </div>

        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.id}>
              {!collapsed ? (
                <p>{group.label}</p>
              ) : (
                <div className="nav-group-divider" title={group.label} />
              )}
              {group.items.map((item: NavItemConfig) => {
                const activeKey = navigationFacade.resolveActiveSidebarPage(page);
                const isActive = activeKey === item.page;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'nav-item-collapsed' : ''}`}
                    onClick={() => {
                      setPage(item.page);
                      close();
                    }}
                    title={`${item.label} ${item.subtitle ? `(${item.subtitle})` : ''}`}
                  >
                    <Icon name={item.icon} size={18} />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.hierarchyTag ? (
                      <span className="nav-hierarchy-pill">
                        {item.hierarchyTag}
                      </span>
                    ) : null}
                    {!collapsed && item.badgeCount ? <em>{item.badgeCount}</em> : null}
                    {collapsed && item.badgeCount ? <i className="nav-collapsed-badge-dot" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`sidebar-user ${collapsed ? 'sidebar-user-collapsed' : ''}`}>
          <Avatar text="MA" small />
          {!collapsed && (
            <div>
              <strong>Minh Anh</strong>
              <span>Quản trị viên</span>
            </div>
          )}
          <button
            type="button"
            title="Đăng xuất"
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống CMS?')) {
                alert('Đã đăng xuất thành công!');
              }
            }}
          >
            <Icon name={IconName.LOGOUT} size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}
