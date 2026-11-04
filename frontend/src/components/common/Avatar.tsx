import React from 'react';

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
