import React from 'react';

export interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className={`logo-wrap ${collapsed ? 'logo-collapsed' : ''}`}>
      <div className="logo-mark" title="HISGO CONTENT SYSTEM">
        <span>H</span>
        <i />
      </div>
      {!collapsed && (
        <div className="logo-text">
          <strong>HISGO</strong>
          <small>CONTENT SYSTEM</small>
        </div>
      )}
    </div>
  );
}
