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
        <strong className="text-slate-900 text-sm font-semibold">{title}</strong>
        <small className="text-slate-600 text-xs font-normal mt-0.5 block">{sub}</small>
      </div>
    </div>
  );
}
