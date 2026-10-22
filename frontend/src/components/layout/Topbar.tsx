'use client';
import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/common/Avatar';
import { IconName } from '@/constants/icons';
import { navigationFacade } from '@/services/navigation/navigation-strategy.service';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { USER_ROLE_LABELS } from '@/services/auth/public-auth.service';

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
  const user = useAuthSession();

  return (
    <header className="topbar">
      <div className="breadcrumb">
        {/* Nút mở drawer trên Mobile (chỉ hiển thị khi màn hình nhỏ) */}
        <button
          type="button"
          className="menu-btn lg:hidden"
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
        <Avatar text={(user?.username || user?.email || '').slice(0, 2).toUpperCase()} small />
        <div className="top-user">
          <strong>{user?.username || user?.email}</strong>
          <span>{user ? USER_ROLE_LABELS[user.role] ?? user.role : ''}</span>
        </div>
      </div>
    </header>
  );
}
