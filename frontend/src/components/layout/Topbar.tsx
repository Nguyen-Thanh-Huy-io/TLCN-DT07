'use client';
import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/common/Avatar';
import { IconName } from '@/constants/icons';
import { navigationFacade } from '@/services/navigation/navigation-strategy.service';

export interface TopbarProps {
  page: string;
  openNav: () => void;
  collapsed?: boolean;
  toggleCollapse?: () => void;
}

export function Topbar({ page, openNav, collapsed, toggleCollapse }: TopbarProps) {
  const { groupTitle, parentLabel, parentRoute, pageTitle } =
    navigationFacade.resolveBreadcrumb(page);

  const isRootDashboard = page === 'dashboard' || page === '';

  return (
    <header className="topbar">
      <div className="breadcrumb">
        {/* Nút thu gọn / mở rộng menu trên Desktop */}
        <button
          type="button"
          className="desktop-collapse-btn"
          onClick={toggleCollapse}
          title={collapsed ? 'Mở rộng menu bên trái' : 'Thu gọn menu bên trái'}
          aria-label="Thu gọn menu"
        >
          <Icon name={IconName.MENU} size={15} />
        </button>

        {/* Nút mở drawer trên Mobile */}
        <button
          type="button"
          className="menu-btn"
          onClick={openNav}
          aria-label="Mở menu di động"
        >
          <Icon name={IconName.MENU} size={15} />
        </button>

        <Link
          href="/"
          className="text-slate-700 hover:text-slate-900 transition-colors font-medium text-xs"
        >
          HISGO CMS
        </Link>
        <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
        {!isRootDashboard && parentLabel && parentRoute ? (
          <>
            <Link
              href={parentRoute}
              className="text-slate-600 hover:text-slate-900 transition-colors text-xs"
            >
              {parentLabel}
            </Link>
            <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
          </>
        ) : !isRootDashboard && groupTitle !== 'HISGO CMS' ? (
          <>
            <span className="text-slate-600 text-xs">{groupTitle}</span>
            <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
          </>
        ) : null}
        <strong className="text-slate-900 text-xs font-semibold">{pageTitle}</strong>
      </div>

      <div className="top-actions">
        <label className="global-search">
          <Icon name={IconName.SEARCH} size={14} className="text-slate-400" />
          <input placeholder="Tìm nhanh (⌘K)..." />
          <kbd>⌘K</kbd>
        </label>
        <button
          type="button"
          className="icon-btn notification"
          aria-label="Thông báo"
        >
          <Icon name={IconName.BELL} size={15} />
          <i />
        </button>
        <span className="top-divider" />
        <Avatar text="MA" small />
        <div className="top-user">
          <strong>Minh Anh</strong>
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}
