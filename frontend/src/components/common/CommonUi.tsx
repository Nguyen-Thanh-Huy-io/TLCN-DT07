import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName, IconNameType } from '@/constants/enums';
import { BadgeTone } from '@/constants/ui-theme';

export interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className={`logo-wrap ${collapsed ? 'logo-collapsed' : ''}`}>
      <div className="logo-mark" title="HISGO CMS">
        <span>H</span>
      </div>
      {!collapsed && (
        <div className="logo-text">
          <strong>HISGO</strong>
          <span className="logo-tag">CMS</span>
        </div>
      )}
    </div>
  );
}

export interface AvatarProps {
  text?: string;
  small?: boolean;
  className?: string;
}

export function Avatar({ text = 'MA', small = false, className = '' }: AvatarProps) {
  return (
    <span className={`avatar ${small ? 'avatar-sm' : ''} ${className}`.trim()}>
      {text}
    </span>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone | string;
  className?: string;
}

export function Badge({ children, tone = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}

export interface UserCellProps {
  initials: string;
  name: string;
}

export function UserCell({ initials, name }: UserCellProps) {
  return (
    <div className="user-cell">
      <Avatar text={initials} small />
      <span>{name}</span>
    </div>
  );
}

export interface ContentCellProps {
  icon: IconName | IconNameType;
  title: string;
  sub: string;
}

export function ContentCell({ icon, title, sub }: ContentCellProps) {
  return (
    <div className="content-cell">
      <span>
        <Icon name={icon} size={17} />
      </span>
      <div>
        <strong className="text-slate-900 text-sm font-semibold">{title}</strong>
        <small className="text-slate-600 text-xs font-normal mt-0.5 block">{sub}</small>
      </div>
    </div>
  );
}

export interface QuickActionProps {
  icon: IconName;
  label: string;
  primary?: boolean;
  onClick: () => void;
}

export function QuickAction({ icon, label, primary, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      className={`quick-item ${primary ? 'primary' : ''}`}
      onClick={onClick}
    >
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </button>
  );
}

export interface StatCardProps {
  icon: IconName | IconNameType;
  value: string | number;
  label: string;
  detail: string;
  tone?: string;
}

export function StatCard({ icon, value, label, detail }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon name={icon} size={16} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {detail ? <div className="stat-detail">{detail}</div> : null}
    </div>
  );
}
