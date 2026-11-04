import React from 'react';
import { Avatar } from './Avatar';

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
