import React from 'react';

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
