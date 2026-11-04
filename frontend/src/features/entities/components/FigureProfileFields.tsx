'use client';

import { useFigureRoles } from '@/components/figures/figure-roles';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';

/** Key inside HistoricalEntity.metadata that holds the "Tiểu sử & di sản" content (read by the public API). */
export const FIGURE_PROFILE_METADATA_KEY = 'profile';

export interface FigureProfileForm {
  /** Mã vai trò trong danh mục FIGURE_ROLE (thêm vai trò mới ở "Danh mục dùng chung"). */
  roles: string[];
  hometown: string;
  /** Mỗi dòng 1 tác phẩm — liệt kê ngắn gọn, không phải văn xuôi (văn xuôi đi ở khối Văn bản). */
  notableWorks: string;
  famousQuote: string;
}

export const EMPTY_FIGURE_PROFILE: FigureProfileForm = {
  roles: [],
  hometown: '',
  notableWorks: '',
  famousQuote: '',
};

const asText = (value: unknown) => (typeof value === 'string' ? value : '');
const asLines = (value: unknown) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string').join('\n') : '';
const toLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export function figureProfileFromEntity(entity: HistoricalEntityItem): FigureProfileForm {
  const profile = (entity.metadata?.[FIGURE_PROFILE_METADATA_KEY] ?? {}) as Record<string, unknown>;
  return {
    roles: entity.roles ?? [],
    hometown: asText(profile.hometown),
    notableWorks: asLines(profile.notableWorks),
    famousQuote: asText(profile.famousQuote),
  };
}

export function figureProfileToMetadata(
  form: FigureProfileForm,
  existingProfile?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const profile: Record<string, unknown> = {
    ...existingProfile,
    hometown: form.hometown.trim() || undefined,
    notableWorks: toLines(form.notableWorks),
    famousQuote: form.famousQuote.trim() || undefined,
  };
  for (const key of Object.keys(profile)) {
    const value = profile[key];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) delete profile[key];
  }
  return Object.keys(profile).length > 0 ? profile : undefined;
}

const inputClass =
  'w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 transition-colors';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
        {label} {hint && <span className="font-normal text-slate-600">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

export function FigureProfileFields({
  value,
  onChange,
}: {
  value: FigureProfileForm;
  onChange: (next: FigureProfileForm) => void;
}) {
  const set = <K extends keyof FigureProfileForm>(key: K, v: FigureProfileForm[K]) => onChange({ ...value, [key]: v });
  const { options: roleOptions } = useFigureRoles();
  const toggleRole = (role: string) =>
    set('roles', value.roles.includes(role) ? value.roles.filter((r) => r !== role) : [...value.roles, role]);

  return (
    <div className="pt-5 border-t border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">Hồ sơ tóm tắt nhân vật (Infobox)</span>
        <span className="text-xs text-slate-600">Mục để trống sẽ tự động ẩn</span>
      </div>

      <Field label="Vai trò" hint="chọn nhiều">
        <div className="flex flex-wrap gap-2">
          {[
            ...roleOptions,
            ...value.roles.filter((r) => !roleOptions.some((o) => o.code === r)).map((code) => ({ code, label: code })),
          ].map(({ code: role, label }) => {
            const active = value.roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-3.5 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-500'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Quê hương">
          <input type="text" value={value.hometown} onChange={(e) => set('hometown', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Câu nói nổi tiếng">
          <input
            type="text"
            value={value.famousQuote}
            onChange={(e) => set('famousQuote', e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Tác phẩm & chiếu chỉ" hint="mỗi dòng một mục">
        <textarea
          rows={3}
          value={value.notableWorks}
          onChange={(e) => set('notableWorks', e.target.value)}
          className={inputClass}
        />
      </Field>
    </div>
  );
}
