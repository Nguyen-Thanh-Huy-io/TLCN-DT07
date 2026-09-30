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
}

export function Sidebar({ page, setPage, open, close }: SidebarProps) {
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
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-head">
          <Logo />
          <button
            type="button"
            className="mobile-close"
            onClick={close}
            aria-label="Đóng menu"
          >
            ×
          </button>
        </div>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.id}>
              <p>{group.label}</p>
              {group.items.map((item: NavItemConfig) => {
                const activeKey = navigationFacade.resolveActiveSidebarPage(page);
                const isActive = activeKey === item.page;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setPage(item.page);
                      close();
                    }}
                    title={item.subtitle ?? item.label}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    {item.hierarchyTag ? (
                      <span className="nav-hierarchy-pill">
                        {item.hierarchyTag}
                      </span>
                    ) : null}
                    {item.badgeCount ? <em>{item.badgeCount}</em> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <Avatar text="MA" small />
          <div>
            <strong>Minh Anh</strong>
            <span>Quản trị viên</span>
          </div>
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
