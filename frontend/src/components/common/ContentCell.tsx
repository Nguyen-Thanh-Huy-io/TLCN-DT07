import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName, IconNameType } from '@/constants/icons';

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
        <strong>{title}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}
