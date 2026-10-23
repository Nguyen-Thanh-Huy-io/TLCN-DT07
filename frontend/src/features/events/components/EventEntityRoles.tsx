'use client';

import React from 'react';
import type { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';

export interface EventEntityRoleValue {
  role: string;
  roleLabel: string;
  isPrimary: boolean;
  notes: string | null;
}

interface EventEntityRolesProps {
  /** Nhóm EVENT_ROLE trong "Danh mục dùng chung". */
  group?: TaxonomyGroupItem;
  entities: Array<{ id: string; name: string; type?: string | null }>;
  roles: Record<string, EventEntityRoleValue>;
  onChange: (roles: Record<string, EventEntityRoleValue>) => void;
}

const INPUT =
  'w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-amber-500';

/** Vai trò mặc định khi gắn thực thể mới: địa danh → Địa điểm diễn ra, hiện vật → Hiện vật liên quan. */
export function defaultEventRole(type?: string | null): string {
  if (type === 'LOCATION') return 'LOCATION';
  if (type === 'ARTIFACT') return 'ARTIFACT_USED';
  return 'PARTICIPANT';
}

export const emptyEventRole = (type?: string | null): EventEntityRoleValue => ({
  role: defaultEventRole(type),
  roleLabel: '',
  isPrimary: false,
  notes: null,
});

/**
 * Vai trò của từng thực thể đã gắn vào sự kiện: mã vai trò chọn từ danh mục dùng chung
 * (gợi ý theo loại thực thể), mô tả cụ thể trong sự kiện này nhập tự do.
 */
export function EventEntityRoles({ group, entities, roles, onChange }: EventEntityRolesProps) {
  if (entities.length === 0) return null;
  const terms = group?.terms ?? [];

  const update = (id: string, type: string | null | undefined, patch: Partial<EventEntityRoleValue>) =>
    onChange({ ...roles, [id]: { ...(roles[id] ?? emptyEventRole(type)), ...patch } });

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3.5 py-2.5">
        <div className="text-xs font-bold text-slate-900">Vai trò trong sự kiện</div>
        <p className="text-[10px] text-slate-400">
          Chọn vai trò chuẩn để lọc và hiển thị; ô mô tả ghi cụ thể trong sự kiện này (vd. &quot;Chủ tướng nghĩa quân&quot;).
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {entities.map((entity) => {
          const value = roles[entity.id] ?? emptyEventRole(entity.type);
          // Gợi ý vai trò hợp loại thực thể; vai trò đang chọn luôn hiện dù không khớp.
          const options = terms.filter((t) => {
            const types = t.meta?.entityTypes;
            const fits = !Array.isArray(types) || !entity.type || types.includes(entity.type);
            return t.code === value.role || (t.isActive && fits);
          });
          const known = options.some((t) => t.code === value.role);
          return (
            <div key={entity.id} className="grid items-center gap-2 px-3.5 py-2.5 sm:grid-cols-[minmax(0,1.2fr)_11rem_minmax(0,1.6fr)_auto]">
              <div className="truncate text-xs font-semibold text-slate-800" title={entity.name}>
                {entity.name}
              </div>
              <select
                className={INPUT}
                value={value.role}
                disabled={!group}
                onChange={(e) => update(entity.id, entity.type, { role: e.target.value })}
              >
                {!known && <option value={value.role}>{value.role}</option>}
                {options.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                className={INPUT}
                value={value.roleLabel}
                placeholder="Mô tả vai trò (không bắt buộc)"
                onChange={(e) => update(entity.id, entity.type, { roleLabel: e.target.value })}
              />
              <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-600" title="Hiện trên thẻ / ghim bản đồ chính">
                <input
                  type="checkbox"
                  checked={value.isPrimary}
                  onChange={(e) => update(entity.id, entity.type, { isPrimary: e.target.checked })}
                />
                Tiêu biểu
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
