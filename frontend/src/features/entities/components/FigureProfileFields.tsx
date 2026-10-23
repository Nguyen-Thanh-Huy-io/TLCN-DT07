'use client';

import { useFigureRoles } from '@/components/figures/figure-roles';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';

/** Key inside HistoricalEntity.metadata that holds the "Tiểu sử & di sản" content (read by the public API). */
export const FIGURE_PROFILE_METADATA_KEY = 'profile';

export interface FigureProfileForm {
  /** Mã vai trò trong danh mục FIGURE_ROLE (thêm vai trò mới ở "Danh mục dùng chung"). */
  roles: string[];
  biography: string;
  hometown: string;
  backgroundAndYouth: string;
  notableWorks: string;
  legacyAndHonors: string;
  anecdotes: string;
  famousQuote: string;
}

export const EMPTY_FIGURE_PROFILE: FigureProfileForm = {
  roles: [],
  biography: '',
  hometown: '',
  backgroundAndYouth: '',
  notableWorks: '',
  legacyAndHonors: '',
  anecdotes: '',
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
    biography: entity.biography ?? '',
    hometown: asText(profile.hometown),
    backgroundAndYouth: asText(profile.backgroundAndYouth),
    notableWorks: asLines(profile.notableWorks),
    legacyAndHonors: asText(profile.legacyAndHonors),
    anecdotes: asLines(profile.anecdotes),
    famousQuote: asText(profile.famousQuote),
  };
}

/** Builds metadata.profile from the form; returns undefined when every field is empty. */
export function figureProfileToMetadata(form: FigureProfileForm): Record<string, unknown> | undefined {
  const profile: Record<string, unknown> = {
    hometown: form.hometown.trim() || undefined,
    backgroundAndYouth: form.backgroundAndYouth.trim() || undefined,
    notableWorks: toLines(form.notableWorks),
    legacyAndHonors: form.legacyAndHonors.trim() || undefined,
    anecdotes: toLines(form.anecdotes),
    famousQuote: form.famousQuote.trim() || undefined,
  };
  for (const key of Object.keys(profile)) {
    const value = profile[key];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) delete profile[key];
  }
  return Object.keys(profile).length > 0 ? profile : undefined;
}

const inputClass =
  'w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {hint && <span className="font-normal text-slate-400">({hint})</span>}
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
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Hồ sơ nhân vật</span>
        <span className="text-[11px] text-slate-400">Hiển thị ở trang Nhân vật — mục để trống sẽ được ẩn</span>
      </div>

      <Field label="Vai trò" hint="chọn nhiều">
        <div className="flex flex-wrap gap-2">
          {[
            ...roleOptions,
            // Vai trò đã gắn nhưng đang ẩn / chưa có trong danh mục vẫn hiện để bỏ chọn được.
            ...value.roles.filter((r) => !roleOptions.some((o) => o.code === r)).map((code) => ({ code, label: code })),
          ].map(({ code: role, label }) => {
            const active = value.roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                  active
                    ? 'bg-amber-500 border-amber-500 text-white font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Tiểu sử" hint="cuộc đời & sự nghiệp">
        <textarea rows={4} value={value.biography} onChange={(e) => set('biography', e.target.value)} className={inputClass} />
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

      <Field label="Xuất thân & thiếu thời">
        <textarea
          rows={3}
          value={value.backgroundAndYouth}
          onChange={(e) => set('backgroundAndYouth', e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tác phẩm & chiếu chỉ" hint="mỗi dòng một mục">
          <textarea
            rows={4}
            value={value.notableWorks}
            onChange={(e) => set('notableWorks', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Giai thoại" hint="mỗi dòng một giai thoại">
          <textarea rows={4} value={value.anecdotes} onChange={(e) => set('anecdotes', e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Di sản & tôn vinh">
        <textarea
          rows={3}
          value={value.legacyAndHonors}
          onChange={(e) => set('legacyAndHonors', e.target.value)}
          className={inputClass}
        />
      </Field>
    </div>
  );
}
