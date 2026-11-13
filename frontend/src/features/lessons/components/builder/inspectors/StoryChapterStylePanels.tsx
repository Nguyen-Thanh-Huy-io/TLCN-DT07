'use client';

import { EditorialSpreadConfig } from '../../../types/block-builder.types';
import { TAB_INACTIVE_CLASS, TAB_ACTIVE_CLASS } from './StoryChapterLayoutPanels';
import type { UpdateConfigFn } from './StoryChapterLayoutPanels';

export const CONFIG_SECTION_APPEARANCE = 'appearance';

export const CONFIG_SECTION_TYPOGRAPHY = 'typography';

export const FONT_FAMILY_SERIF = 'SERIF';

export const FONT_FAMILY_SANS = 'SANS';

export const FONT_NAME_SERIF = 'var(--font-merriweather), Georgia, serif';

export const FONT_NAME_SANS = 'var(--font-be-vietnam-pro), sans-serif';

export const TYPO_PRESET_MAGAZINE = 'MAGAZINE';

export const TYPO_PRESET_CLASSIC = 'CLASSIC';

export const TYPO_PRESET_MODERN = 'MODERN';

export const SWITCH_ON_BG = 'bg-blue-600';

export const SWITCH_OFF_BG = 'bg-stone-300';

export const SWITCH_ON_TRANSLATE = 'translate-x-4';

export const SWITCH_OFF_TRANSLATE = 'translate-x-0';

export function StoryTypographyTabPanel({
  edConfig,
  updateEditorialConfig,
  currentStylePreset,
  applyTypographyPreset,
  currentFontSizePreset,
}: {
  edConfig: EditorialSpreadConfig;
  updateEditorialConfig: UpdateConfigFn;
  currentStylePreset: string;
  applyTypographyPreset: (preset: 'MAGAZINE' | 'CLASSIC' | 'MODERN') => void;
  currentFontSizePreset: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Phong cách</label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: TYPO_PRESET_MAGAZINE, label: 'Tạp chí' },
              { id: TYPO_PRESET_CLASSIC, label: 'Cổ điển' },
              { id: TYPO_PRESET_MODERN, label: 'Hiện đại' },
            ] as const
          ).map((p) => {
            const active = currentStylePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyTypographyPreset(p.id)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Font tiêu đề</label>
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: FONT_FAMILY_SERIF, label: 'Serif (Có chân)' },
              { id: FONT_FAMILY_SANS, label: 'Sans-serif' },
            ] as const
          ).map((f) => {
            const active =
              (edConfig.typography.headingFont || FONT_FAMILY_SERIF) === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
                    headingFont: f.id,
                    headingFontName:
                      f.id === FONT_FAMILY_SERIF ? FONT_NAME_SERIF : FONT_NAME_SANS,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Font nội dung</label>
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: FONT_FAMILY_SERIF, label: 'Serif (Có chân)' },
              { id: FONT_FAMILY_SANS, label: 'Sans-serif' },
            ] as const
          ).map((f) => {
            const active =
              (edConfig.typography.bodyFont || FONT_FAMILY_SANS) === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
                    bodyFont: f.id,
                    bodyFontName:
                      f.id === FONT_FAMILY_SERIF ? FONT_NAME_SERIF : FONT_NAME_SANS,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-semibold text-stone-700">Chữ cái đầu lớn (Drop Cap)</span>
        <button
          type="button"
          role="switch"
          aria-checked={edConfig.typography.dropCap !== false}
          onClick={() =>
            updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
              dropCap: edConfig.typography.dropCap === false,
            })
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            edConfig.typography.dropCap !== false ? SWITCH_ON_BG : SWITCH_OFF_BG
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
              edConfig.typography.dropCap !== false
                ? SWITCH_ON_TRANSLATE
                : SWITCH_OFF_TRANSLATE
            }`}
          />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Cỡ chữ</label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: 'SM', label: 'Nhỏ', px: 14 },
              { id: 'MD', label: 'Vừa', px: 16 },
              { id: 'LG', label: 'Lớn', px: 18 },
            ] as const
          ).map((sz) => {
            const active = currentFontSizePreset === sz.id;
            return (
              <button
                key={sz.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
                    bodySize: sz.id,
                    bodyFontSizePx: sz.px,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {sz.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StoryAdvancedTabPanel({
  appearance,
  updateEditorialConfig,
}: {
  appearance: NonNullable<EditorialSpreadConfig['appearance']>;
  updateEditorialConfig: UpdateConfigFn;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Màu nền</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { color: '#faf7f2', label: 'Giấy cổ' },
            { color: '#ffffff', label: 'Trắng sáng' },
            { color: '#f3efe6', label: 'Trầm mặc' },
          ].map((preset) => {
            const active = (appearance.backgroundColor || '#faf7f2') === preset.color;
            return (
              <button
                key={preset.color}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
                    backgroundColor: preset.color,
                  })
                }
                className={`px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'border-blue-600 bg-blue-50/40 text-blue-700'
                    : 'border-stone-200 bg-white text-stone-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                  style={{ backgroundColor: preset.color }}
                />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-semibold text-stone-700">Đường phân cách</span>
        <button
          type="button"
          role="switch"
          aria-checked={appearance.showRegionDividers !== false}
          onClick={() =>
            updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
              showRegionDividers: appearance.showRegionDividers === false,
            })
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            appearance.showRegionDividers !== false ? SWITCH_ON_BG : SWITCH_OFF_BG
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
              appearance.showRegionDividers !== false
                ? SWITCH_ON_TRANSLATE
                : SWITCH_OFF_TRANSLATE
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-semibold text-stone-700">
          Hiển thị trên thiết bị di động
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={!appearance.hideOnMobile}
          onClick={() =>
            updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
              hideOnMobile: !appearance.hideOnMobile,
            })
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            !appearance.hideOnMobile ? SWITCH_ON_BG : SWITCH_OFF_BG
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
              !appearance.hideOnMobile ? SWITCH_ON_TRANSLATE : SWITCH_OFF_TRANSLATE
            }`}
          />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">
          Hiệu ứng xuất hiện khi cuộn
        </label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: 'NONE', label: 'Tắt' },
              { id: 'FADE_UP', label: 'Mờ dần' },
              { id: 'REVEAL', label: 'Trượt nhẹ' },
            ] as const
          ).map((anim) => {
            const active = (appearance.scrollAnimation || 'NONE') === anim.id;
            return (
              <button
                key={anim.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
                    scrollAnimation: anim.id,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {anim.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
