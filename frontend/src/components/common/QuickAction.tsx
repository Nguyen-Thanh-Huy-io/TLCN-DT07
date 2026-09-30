import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface QuickActionProps {
  icon: IconName;
  label: string;
  primary?: boolean;
  onClick: () => void;
}

export function QuickAction({
  icon,
  label,
  primary,
  onClick,
}: QuickActionProps) {
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
