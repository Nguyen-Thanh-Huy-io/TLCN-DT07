'use client';

import React, { useId, useState } from 'react';
import { EventCategory, EVENT_CATEGORY_LABELS } from '@/constants/enums';

export interface EventCategoryMetadataFieldProps {
  category: EventCategory;
  metadata: Record<string, any>;
  onChange: (metadata: Record<string, any>) => void;
}

// Khai báo các field key hằng số để tuyệt đối không dùng magic string
export const METADATA_KEYS = {
  BATTLE: {
    BELLIGERENTS: 'belligerents',
    COMMANDERS: 'commanders',
    CASUALTIES: 'casualties',
    TACTICS: 'tactics',
    STRENGTH: 'strength',
  },
  TREATY: {
    SIGNATORIES: 'signatories',
    RATIFIED_DATE: 'ratifiedDate',
    TERMS_SUMMARY: 'termsSummary',
    TERRITORIAL_CHANGES: 'territorialChanges',
  },
  NATURAL_DISASTER: {
    INTENSITY: 'intensity',
    CASUALTIES_COUNT: 'casualtiesCount',
    AFFECTED_AREA: 'affectedArea',
  },
  CONFERENCE_REVOLUTION: {
    PARTICIPANTS: 'participants',
    LEADERS: 'leaders',
    KEY_RESOLUTIONS: 'keyResolutions',
  },
} as const;

export function EventCategoryMetadataField({
  category,
  metadata,
  onChange,
}: EventCategoryMetadataFieldProps) {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'RAW'>('VISUAL');
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);
  const rawInputId = useId();

  const handleFieldChange = (key: string, value: any) => {
    onChange({
      ...metadata,
      [key]: value,
    });
  };

  const handleArrayStringChange = (key: string, valueStr: string) => {
    const arr = valueStr
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    onChange({
      ...metadata,
      [key]: arr,
    });
  };

  const handleRawJsonChange = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        onChange(parsed);
        setRawJsonError(null);
      } else {
        setRawJsonError('Dữ liệu JSON phải là một đối tượng (Object), không phải mảng hay số.');
      }
    } catch (e: any) {
      setRawJsonError(`Cú pháp JSON chưa đúng: ${e.message}`);
    }
  };

  const renderBattleForm = () => {
    const belligerents = Array.isArray(metadata[METADATA_KEYS.BATTLE.BELLIGERENTS])
      ? metadata[METADATA_KEYS.BATTLE.BELLIGERENTS].join('; ')
      : metadata[METADATA_KEYS.BATTLE.BELLIGERENTS] || '';

    const commanders = Array.isArray(metadata[METADATA_KEYS.BATTLE.COMMANDERS])
      ? metadata[METADATA_KEYS.BATTLE.COMMANDERS].join('; ')
      : metadata[METADATA_KEYS.BATTLE.COMMANDERS] || '';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Các bên tham chiến (phân cách bằng dấu chấm phẩy &apos;;&apos;)
            </span>
            <input
              type="text"
              value={belligerents}
              onChange={(e) =>
                handleArrayStringChange(METADATA_KEYS.BATTLE.BELLIGERENTS, e.target.value)
              }
              placeholder="VD: Quân Tây Sơn; Quân Thanh; Quân Lê Chiêu Thống"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Chỉ huy / Lãnh đạo chủ chốt
            </span>
            <input
              type="text"
              value={commanders}
              onChange={(e) =>
                handleArrayStringChange(METADATA_KEYS.BATTLE.COMMANDERS, e.target.value)
              }
              placeholder="VD: Quang Trung - Nguyễn Huệ; Tôn Sĩ Nghị; Sầm Nghi Đống"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Lực lượng / Quân số huy động
            </span>
            <input
              type="text"
              value={metadata[METADATA_KEYS.BATTLE.STRENGTH] || ''}
              onChange={(e) =>
                handleFieldChange(METADATA_KEYS.BATTLE.STRENGTH, e.target.value)
              }
              placeholder="VD: Tây Sơn: ~10 vạn; Quân Thanh: ~29 vạn"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Thương vong / Thiệt hại
            </span>
            <input
              type="text"
              value={metadata[METADATA_KEYS.BATTLE.CASUALTIES] || ''}
              onChange={(e) =>
                handleFieldChange(METADATA_KEYS.BATTLE.CASUALTIES, e.target.value)
              }
              placeholder="VD: Quân Thanh tan vỡ hàng vạn người..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Chiến thuật / Nghệ thuật quân sự
            </span>
            <input
              type="text"
              value={metadata[METADATA_KEYS.BATTLE.TACTICS] || ''}
              onChange={(e) =>
                handleFieldChange(METADATA_KEYS.BATTLE.TACTICS, e.target.value)
              }
              placeholder="VD: Hành quân thần tốc, bất ngờ bao vây công đồn..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>
      </div>
    );
  };

  const renderTreatyForm = () => {
    const signatories = Array.isArray(metadata[METADATA_KEYS.TREATY.SIGNATORIES])
      ? metadata[METADATA_KEYS.TREATY.SIGNATORIES].join('; ')
      : metadata[METADATA_KEYS.TREATY.SIGNATORIES] || '';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Các bên ký kết
            </span>
            <input
              type="text"
              value={signatories}
              onChange={(e) =>
                handleArrayStringChange(METADATA_KEYS.TREATY.SIGNATORIES, e.target.value)
              }
              placeholder="VD: Việt Nam Dân chủ Cộng hòa; Chính phủ Pháp..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Ngày phê chuẩn / có hiệu lực
            </span>
            <input
              type="text"
              value={metadata[METADATA_KEYS.TREATY.RATIFIED_DATE] || ''}
              onChange={(e) =>
                handleFieldChange(METADATA_KEYS.TREATY.RATIFIED_DATE, e.target.value)
              }
              placeholder="VD: 21/07/1954 hoặc 1954"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Tóm tắt điều khoản chính
            </span>
            <textarea
              value={metadata[METADATA_KEYS.TREATY.TERMS_SUMMARY] || ''}
              onChange={(e) =>
                handleFieldChange(METADATA_KEYS.TREATY.TERMS_SUMMARY, e.target.value)
              }
              rows={3}
              placeholder="Tóm tắt các điều khoản cốt lõi của hiệp ước, tuyên bố chung..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Thay đổi lãnh thổ / Ranh giới quân sự
            </span>
            <textarea
              value={metadata[METADATA_KEYS.TREATY.TERRITORIAL_CHANGES] || ''}
              onChange={(e) =>
                handleFieldChange(METADATA_KEYS.TREATY.TERRITORIAL_CHANGES, e.target.value)
              }
              rows={3}
              placeholder="VD: Giới tuyến quân sự tạm thời tại vĩ tuyến 17..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>
      </div>
    );
  };

  const renderNaturalDisasterForm = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700 block mb-1">
            Cường độ / Thang đo
          </span>
          <input
            type="text"
            value={metadata[METADATA_KEYS.NATURAL_DISASTER.INTENSITY] || ''}
            onChange={(e) =>
              handleFieldChange(METADATA_KEYS.NATURAL_DISASTER.INTENSITY, e.target.value)
            }
            placeholder="VD: Cấp 12; 7.8 Richter; Đại hồng thủy..."
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 block mb-1">
            Thiệt hại / Số nạn nhân
          </span>
          <input
            type="text"
            value={metadata[METADATA_KEYS.NATURAL_DISASTER.CASUALTIES_COUNT] || ''}
            onChange={(e) =>
              handleFieldChange(METADATA_KEYS.NATURAL_DISASTER.CASUALTIES_COUNT, e.target.value)
            }
            placeholder="VD: Hàng vạn người tử nạn, mất trắng mùa màng..."
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 block mb-1">
            Vùng ảnh hưởng trọng điểm
          </span>
          <input
            type="text"
            value={metadata[METADATA_KEYS.NATURAL_DISASTER.AFFECTED_AREA] || ''}
            onChange={(e) =>
              handleFieldChange(METADATA_KEYS.NATURAL_DISASTER.AFFECTED_AREA, e.target.value)
            }
            placeholder="VD: Toàn bộ đồng bằng Bắc Bộ và lưu vực sông Hồng..."
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </label>
      </div>
    );
  };

  const renderGeneralForm = () => {
    const participants = Array.isArray(metadata[METADATA_KEYS.CONFERENCE_REVOLUTION.PARTICIPANTS])
      ? metadata[METADATA_KEYS.CONFERENCE_REVOLUTION.PARTICIPANTS].join('; ')
      : metadata[METADATA_KEYS.CONFERENCE_REVOLUTION.PARTICIPANTS] || '';

    const leaders = Array.isArray(metadata[METADATA_KEYS.CONFERENCE_REVOLUTION.LEADERS])
      ? metadata[METADATA_KEYS.CONFERENCE_REVOLUTION.LEADERS].join('; ')
      : metadata[METADATA_KEYS.CONFERENCE_REVOLUTION.LEADERS] || '';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Thành phần / Đại biểu / Quốc gia tham dự
            </span>
            <input
              type="text"
              value={participants}
              onChange={(e) =>
                handleArrayStringChange(
                  METADATA_KEYS.CONFERENCE_REVOLUTION.PARTICIPANTS,
                  e.target.value,
                )
              }
              placeholder="VD: Đại diện các nước Á - Phi; Các tổ chức cách mạng..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Lãnh đạo chủ trì / Chủ tọa
            </span>
            <input
              type="text"
              value={leaders}
              onChange={(e) =>
                handleArrayStringChange(
                  METADATA_KEYS.CONFERENCE_REVOLUTION.LEADERS,
                  e.target.value,
                )
              }
              placeholder="VD: Chủ tịch Hồ Chí Minh; Thủ tướng Phạm Văn Đồng..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 block mb-1">
            Tuyên bố chung / Nghị quyết / Văn kiện ban hành
          </span>
          <textarea
            value={metadata[METADATA_KEYS.CONFERENCE_REVOLUTION.KEY_RESOLUTIONS] || ''}
            onChange={(e) =>
              handleFieldChange(
                METADATA_KEYS.CONFERENCE_REVOLUTION.KEY_RESOLUTIONS,
                e.target.value,
              )
            }
            rows={3}
            placeholder="Ghi nhận các quyết định hoặc mục tiêu mang tính bước ngoặt..."
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </label>
      </div>
    );
  };

  const renderActiveCategoryForm = () => {
    switch (category) {
      case EventCategory.BATTLE:
      case EventCategory.WAR:
        return renderBattleForm();
      case EventCategory.TREATY:
        return renderTreatyForm();
      case EventCategory.NATURAL_DISASTER:
        return renderNaturalDisasterForm();
      case EventCategory.REVOLUTION:
      case EventCategory.POLITICAL_EVENT:
      case EventCategory.SUMMIT_CONFERENCE:
      case EventCategory.CULTURE_SCIENCE:
      case EventCategory.OTHER:
      default:
        return renderGeneralForm();
    }
  };

  return (
    <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/70 space-y-3.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>Thông tin đặc thù theo thể loại:</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
              {EVENT_CATEGORY_LABELS[category] || category}
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Các trường dữ liệu đặc trưng được chuẩn hóa theo mẫu thực tế sử học.
          </p>
        </div>

        {/* Tab chuyển đổi giao diện nhập / JSON */}
        <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('VISUAL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === 'VISUAL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Biểu mẫu nhập
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RAW')}
            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === 'RAW'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dữ liệu JSON
          </button>
        </div>
      </div>

      {activeTab === 'VISUAL' ? (
        renderActiveCategoryForm()
      ) : (
        <div className="space-y-2">
          <label htmlFor={rawInputId} className="block text-xs font-semibold text-slate-700">
            Chỉnh sửa JSON metadata trực tiếp:
          </label>
          <textarea
            id={rawInputId}
            value={JSON.stringify(metadata, null, 2)}
            onChange={(e) => handleRawJsonChange(e.target.value)}
            rows={6}
            className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
          />
          {rawJsonError && (
            <p className="text-xs text-rose-500 font-medium">⚠️ {rawJsonError}</p>
          )}
        </div>
      )}
    </div>
  );
}
