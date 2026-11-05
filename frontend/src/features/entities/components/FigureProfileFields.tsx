'use client';

import { useState, useMemo } from 'react';
import { useFigureRoles } from '@/components/figures/useFigureRoles';
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
  'w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors shadow-2xs';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-800 mb-1.5">
        {label} {hint && <span className="font-normal text-slate-500">({hint})</span>}
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
  const set = <K extends keyof FigureProfileForm>(key: K, v: FigureProfileForm[K]) =>
    onChange({ ...value, [key]: v });

  // Danh mục vai trò chuẩn từ Taxonomy FIGURE_ROLE
  const { options: roleOptions, icon: roleIcon } = useFigureRoles();

  const [roleSearch, setRoleSearch] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Danh sách vai trò chưa được chọn
  const unselectedOptions = useMemo(() => {
    return [
      ...roleOptions,
      ...value.roles
        .filter((r) => !roleOptions.some((o) => o.code === r))
        .map((code) => ({ code, label: code, Icon: roleIcon(code) })),
    ].filter((opt) => !value.roles.includes(opt.code));
  }, [roleOptions, value.roles, roleIcon]);

  // Danh sách vai trò sau khi lọc theo từ khóa tìm kiếm
  const filteredRoleOptions = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return unselectedOptions.slice(0, 8);
    return unselectedOptions
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.code.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [unselectedOptions, roleSearch]);

  // Gợi ý nhanh tối đa 5 vai trò phổ biến chưa chọn
  const quickSuggestions = useMemo(() => {
    return unselectedOptions.slice(0, 5);
  }, [unselectedOptions]);

  const handleAddRole = (code: string) => {
    if (!value.roles.includes(code)) {
      set('roles', [...value.roles, code]);
    }
    setRoleSearch('');
    setIsRoleDropdownOpen(false);
  };

  const handleRemoveRole = (code: string) => {
    set(
      'roles',
      value.roles.filter((r) => r !== code),
    );
  };

  return (
    <div className="pt-4 border-t border-slate-200/80 space-y-4 bg-amber-50/30 p-4 rounded-2xl border border-amber-200/50">
      <div className="flex items-center justify-between pb-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Hồ sơ tóm tắt nhân vật (Infobox)
          </span>
          <p className="text-[11px] text-amber-800/80 mt-0.5">
            Thông tin thẻ nhận diện hiển thị ở đầu bài viết và kết quả tìm kiếm.
          </p>
        </div>
        <span className="text-[11px] text-slate-400">Mục để trống sẽ tự động ẩn</span>
      </div>

      {/* Vai trò nhân vật (Tìm kiếm Autocomplete + Danh sách đã chọn) */}
      <Field label="Vai trò nhân vật" hint="chọn nhiều từ danh mục FIGURE_ROLE">
        <div className="space-y-2.5">
          {/* Ô tìm kiếm Autocomplete */}
          <div className="relative">
            <input
              type="text"
              value={roleSearch}
              onChange={(e) => {
                setRoleSearch(e.target.value);
                setIsRoleDropdownOpen(true);
              }}
              onFocus={() => setIsRoleDropdownOpen(true)}
              placeholder="🔍 Gõ từ khóa tìm vai trò (VD: Vua, Danh tướng, Nhà cách mạng, Quan lại...)"
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition shadow-2xs"
            />
            {roleSearch && (
              <button
                type="button"
                onClick={() => setRoleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}

            {/* Dropdown danh sách vai trò khớp tìm kiếm */}
            {isRoleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsRoleDropdownOpen(false)}
                />
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Gợi ý vai trò ({filteredRoleOptions.length})</span>
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      Đóng ✕
                    </button>
                  </div>
                  {filteredRoleOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Không tìm thấy vai trò nào phù hợp với &quot;{roleSearch}&quot;
                    </div>
                  ) : (
                    filteredRoleOptions.map(({ code, label, Icon }) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleAddRole(code)}
                        className="w-full px-3.5 py-2 text-left hover:bg-amber-50/60 flex items-center gap-2.5 text-xs transition cursor-pointer"
                      >
                        <Icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="font-semibold text-slate-800">{label}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Danh sách vai trò ĐÃ CHỌN */}
          <div className="pt-0.5">
            {value.roles.length === 0 ? (
              <div className="p-2.5 rounded-xl border border-dashed border-amber-200/70 text-center text-xs text-slate-400 bg-white/60">
                Chưa chọn vai trò nào. Tìm kiếm ở trên hoặc bấm vào các gợi ý bên dưới để thêm.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {value.roles.map((code) => {
                  const opt = roleOptions.find((o) => o.code === code);
                  const label = opt?.label ?? code;
                  const Icon = opt?.Icon ?? roleIcon(code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-semibold shadow-2xs"
                    >
                      <Icon className="w-3 h-3 text-amber-200" />
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(code)}
                        className="text-amber-200 hover:text-white font-bold ml-1 cursor-pointer"
                        title="Gỡ vai trò này"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gợi ý nhanh các vai trò chưa chọn */}
          {quickSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-500">
              <span className="text-slate-400">Gợi ý nhanh:</span>
              {quickSuggestions.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleAddRole(code)}
                  className="px-2.5 py-0.5 rounded-full bg-white hover:bg-amber-100 hover:text-amber-900 text-slate-600 border border-slate-200 transition text-[11px] font-medium cursor-pointer"
                >
                  + {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Quê hương / Nguyên quán">
          <input
            type="text"
            value={value.hometown}
            onChange={(e) => set('hometown', e.target.value)}
            placeholder="Ví dụ: Làng Cổ Nhuế, Huyện Từ Liêm..."
            className={inputClass}
          />
        </Field>
        <Field label="Câu nói nổi tiếng">
          <input
            type="text"
            value={value.famousQuote}
            onChange={(e) => set('famousQuote', e.target.value)}
            placeholder="Ví dụ: Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo..."
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Tác phẩm, chiếu chỉ & công trình tiêu biểu" hint="mỗi dòng một mục">
        <textarea
          rows={3}
          value={value.notableWorks}
          onChange={(e) => set('notableWorks', e.target.value)}
          placeholder="Ví dụ:
Hịch tướng sĩ
Binh thư yếu lược"
          className={inputClass}
        />
      </Field>
    </div>
  );
}
