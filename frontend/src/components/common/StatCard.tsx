import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName, IconNameType } from '@/constants/icons';

export interface StatCardProps {
  icon: IconName | IconNameType;
  value: string | number;
  label: string;
  detail: string;
  tone?: string;
}

export function StatCard({
  icon,
  value,
  label,
  detail,
}: StatCardProps) {
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
