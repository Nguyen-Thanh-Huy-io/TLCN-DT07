import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName, IconNameType } from '@/constants/icons';

export interface StatCardProps {
  icon: IconName | IconNameType;
  value: string | number;
  label: string;
  detail: string;
  tone: string;
}

export function StatCard({
  icon,
  value,
  label,
  detail,
  tone,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} size={21} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-detail">
        <span>↑ 12%</span>
        {detail}
      </div>
    </div>
  );
}
