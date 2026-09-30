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
}

export function Topbar({ page, openNav }: TopbarProps) {
  const { groupTitle, parentLabel, parentRoute, pageTitle } =
    navigationFacade.resolveBreadcrumb(page);

  const isRootDashboard = page === 'dashboard' || page === '';

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          type="button"
          className="menu-btn"
          onClick={openNav}
          aria-label="Mở menu"
        >
          <Icon name={IconName.MENU} />
        </button>
        <Link href="/" className="hover:text-blue-900 transition-colors">
          HISGO CMS
        </Link>
        <Icon name={IconName.CHEVRON} size={14} />
        {!isRootDashboard && parentLabel && parentRoute ? (
          <>
            <Link href={parentRoute} className="hover:text-blue-900 transition-colors">
              {parentLabel}
            </Link>
            <Icon name={IconName.CHEVRON} size={14} />
          </>
        ) : !isRootDashboard && groupTitle !== 'HISGO CMS' ? (
          <>
            <span>{groupTitle}</span>
            <Icon name={IconName.CHEVRON} size={14} />
          </>
        ) : null}
        <strong>{pageTitle}</strong>
      </div>
      <div className="top-actions">
        <label className="global-search">
          <Icon name={IconName.SEARCH} size={17} />
          <input placeholder="Tìm kiếm trong hệ thống..." />
          <kbd>⌘ K</kbd>
        </label>
        <button
          type="button"
          className="icon-btn notification"
          aria-label="Thông báo"
        >
          <Icon name={IconName.BELL} />
          <i />
        </button>
        <span className="top-divider" />
        <Avatar text="MA" small />
        <div className="top-user">
          <strong>Minh Anh</strong>
          <span>Quản trị viên</span>
        </div>
        <Icon name={IconName.CHEVRON} size={14} />
      </div>
    </header>
  );
}
