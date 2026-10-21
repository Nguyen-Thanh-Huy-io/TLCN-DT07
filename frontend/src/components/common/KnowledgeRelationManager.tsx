'use client';
import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export enum KnowledgeRelationType {
  ALL = 'ALL',
  EVENT = 'EVENT',
  PERIOD = 'PERIOD',
  PERSON = 'PERSON',
  LOCATION = 'LOCATION',
  TOPIC = 'TOPIC',
  FORCE = 'FORCE',
  ARTIFACT = 'ARTIFACT',
}

export interface KnowledgeRelationItem {
  id: string; // ID duy nhất trong danh sách (prefix + id thực tế, ví dụ `entity:123` hoặc `location:456`)
  rawId: string; // ID thực tế của bản ghi trong database
  name: string;
  type: KnowledgeRelationType;
  typeLabel: string;
  subtitle?: string | null;
  yearLabel?: string | null;
  relationLabel?: string; // Tên quan hệ hiển thị rõ ràng (VD: Thuộc thời kỳ, Trực thuộc chiến dịch, Nhân vật tham gia,...)
}

export interface KnowledgeRelationManagerProps {
  // Danh sách các thực thể tham chiếu lấy từ Database qua API
  availableItems: KnowledgeRelationItem[];
  // Danh sách các liên kết đã gắn hiện tại với sự kiện
  linkedItems: KnowledgeRelationItem[];
  // Callbacks cập nhật
  onAddItems: (items: KnowledgeRelationItem[]) => void;
  onRemoveItem: (id: string) => void;
}

const TAB_CONFIGS: Array<{ type: KnowledgeRelationType; label: string }> = [
  { type: KnowledgeRelationType.ALL, label: 'Tất cả' },
  { type: KnowledgeRelationType.EVENT, label: 'Sự kiện' },
  { type: KnowledgeRelationType.PERIOD, label: 'Thời kỳ' },
  { type: KnowledgeRelationType.PERSON, label: 'Nhân vật' },
  { type: KnowledgeRelationType.LOCATION, label: 'Địa điểm' },
  { type: KnowledgeRelationType.TOPIC, label: 'Chủ đề' },
  { type: KnowledgeRelationType.FORCE, label: 'Lực lượng' },
  { type: KnowledgeRelationType.ARTIFACT, label: 'Hiện vật' },
];

const TYPE_BADGE_STYLE: Record<KnowledgeRelationType, string> = {
  [KnowledgeRelationType.ALL]: 'bg-slate-100 text-slate-700 border-slate-200',
  [KnowledgeRelationType.EVENT]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [KnowledgeRelationType.PERIOD]: 'bg-purple-50 text-purple-700 border-purple-200',
  [KnowledgeRelationType.PERSON]: 'bg-sky-50 text-sky-700 border-sky-200',
  [KnowledgeRelationType.LOCATION]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [KnowledgeRelationType.TOPIC]: 'bg-amber-50 text-amber-800 border-amber-200',
  [KnowledgeRelationType.FORCE]: 'bg-rose-50 text-rose-700 border-rose-200',
  [KnowledgeRelationType.ARTIFACT]: 'bg-teal-50 text-teal-700 border-teal-200',
};

/**
 * Component Quản lý Quan hệ tri thức đồng bộ 100% với phong cách giao diện cha (Light theme)
 * - View chính: Danh sách liên kết kèm bộ lọc tab (Tất cả, Sự kiện, Thời kỳ, Nhân vật, Địa điểm, Chủ đề, Lực lượng, Hiện vật).
 * - Modal: Thêm liên kết tri thức với tìm kiếm realtime và chọn nhiều bản ghi liên tiếp từ dữ liệu thực tế trong Database.
 */
export function KnowledgeRelationManager({
  availableItems,
  linkedItems,
  onAddItems,
  onRemoveItem,
}: KnowledgeRelationManagerProps) {
  const [activeTab, setActiveTab] = useState<KnowledgeRelationType>(KnowledgeRelationType.ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<KnowledgeRelationItem | null>(null);

  // State bên trong Modal
  const [modalTab, setModalTab] = useState<KnowledgeRelationType>(KnowledgeRelationType.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(new Set());

  // Lọc danh sách hiển thị trên bảng chính
  const filteredLinkedItems = useMemo(() => {
    if (activeTab === KnowledgeRelationType.ALL) return linkedItems;
    return linkedItems.filter((item) => item.type === activeTab);
  }, [linkedItems, activeTab]);

  // Danh sách các ID đã liên kết để loại bỏ hoặc đánh dấu trong Modal
  const linkedIdSet = useMemo(() => new Set(linkedItems.map((i) => i.id)), [linkedItems]);

  // Lọc danh sách ứng viên trong Modal (dữ liệu thật từ DB)
  const modalCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return availableItems.filter((item) => {
      // Ẩn các mục đã liên kết rồi
      if (linkedIdSet.has(item.id)) return false;

      // Lọc theo Tab loại thực thể
      if (modalTab !== KnowledgeRelationType.ALL && item.type !== modalTab) {
        return false;
      }

      // Lọc theo từ khóa tìm kiếm
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.typeLabel.toLowerCase().includes(q)
      );
    });
  }, [availableItems, linkedIdSet, modalTab, searchQuery]);

  const handleOpenModal = () => {
    setModalSelectedIds(new Set());
    setSearchQuery('');
    setModalTab(KnowledgeRelationType.ALL);
    setIsModalOpen(true);
  };

  const handleToggleModalItem = (id: string) => {
    setModalSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmAdd = () => {
    const selectedItemsToAdd = availableItems.filter((item) => modalSelectedIds.has(item.id));
    if (selectedItemsToAdd.length > 0) {
      onAddItems(selectedItemsToAdd);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* KHUNG CHÍNH DANH SÁCH LIÊN KẾT (ĐỒNG BỘ MÀU SẮC GIAO DIỆN CHA) */}
      <div className="rounded-2xl bg-white text-slate-800 p-5 border border-slate-200 shadow-xs space-y-5">
        {/* Tiêu đề & Subtitle & Nút Thêm liên kết */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Danh sách liên kết
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ các mối quan hệ tri thức (Thời kỳ, Sự kiện cha, Nhân vật, Địa điểm, Hiện vật...) được quản lý tập trung tại đây.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 py-2 rounded-full bg-[#5C3D1E] hover:bg-[#432c15] text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <span>+</span>
            <span>Thêm liên kết</span>
          </button>
        </div>

        {/* Thanh Tabs Lọc Loại Thực Thể (Pill Tabs đồng bộ tone của Left Sidebar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TAB_CONFIGS.map((tab) => {
            const isActive = activeTab === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#EFE3C8] text-[#5C3D1E] border-[#DFC99B] font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 border-slate-200/70 font-medium'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bảng Danh Sách Thực Thể Đã Gắn */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">STT</div>
            <div className="col-span-6 md:col-span-6">Thực thể liên kết</div>
            <div className="col-span-3 md:col-span-3">Loại quan hệ</div>
            <div className="col-span-2 md:col-span-2 text-right">Thao tác</div>
          </div>

          {filteredLinkedItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Chưa có thực thể nào thuộc mục này. Bấm{' '}
              <button
                type="button"
                onClick={handleOpenModal}
                className="text-amber-800 hover:text-amber-900 underline font-semibold cursor-pointer"
              >
                + Thêm liên kết
              </button>{' '}
              để gắn vào sự kiện.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLinkedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-amber-50/25 transition"
                >
                  <div className="col-span-1 text-center text-xs font-mono text-slate-400 font-semibold">
                    {idx + 1}
                  </div>

                  <div className="col-span-6 md:col-span-6 space-y-1">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{item.name}</span>
                      {item.yearLabel && (
                        <span className="text-xs font-mono text-slate-500 font-normal">
                          ({item.yearLabel})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          TYPE_BADGE_STYLE[item.type] ||
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.typeLabel}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[240px]">
                        {item.subtitle || 'Đã liên kết'}
                      </span>
                    </div>
                  </div>

                  {/* Cột Loại quan hệ */}
                  <div className="col-span-3 md:col-span-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80">
                      {item.relationLabel || item.typeLabel}
                    </span>
                  </div>

                  <div className="col-span-2 md:col-span-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title="Xem thông tin"
                      onClick={() => setDetailItem(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                    >
                      <span className="font-mono text-xs border border-current rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        i
                      </span>
                    </button>
                    <button
                      type="button"
                      title="Gỡ bỏ liên kết"
                      onClick={() => onRemoveItem(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Dưới Bảng: Tổng số + Nút Thêm mục khác */}
        <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
          <div className="text-xs text-slate-500">
            Tổng số: <b className="text-slate-900 font-bold">{linkedItems.length}</b> liên kết
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition cursor-pointer inline-flex items-center gap-1.5 font-medium shadow-2xs"
          >
            <span>+</span>
            <span>Thêm mục khác</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-100">
          Gợi ý: Mạng lưới liên kết này được lưu trữ trực tiếp vào cơ sở dữ liệu và tự động kết nối với Đồ thị Tri thức (Knowledge Graph), dòng thời gian và bản đồ lịch sử của HISGO.
        </div>
      </div>

      {/* MODAL "THÊM LIÊN KẾT TRI THỨC" (ĐỒNG BỘ LIGHT THEME SẠCH SẼ) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in duration-150">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Thêm liên kết tri thức
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tìm và chọn các thực thể trong cơ sở dữ liệu để liên kết với sự kiện.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Thân Modal */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Phân loại thực thể */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800">
                  Loại thực thể
                </div>
                <div className="text-[11px] text-slate-500">
                  Chọn loại để lọc nhanh danh mục. Không bắt buộc nhập loại quan hệ.
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                  {TAB_CONFIGS.map((tab) => {
                    const isActive = modalTab === tab.type;
                    return (
                      <button
                        key={tab.type}
                        type="button"
                        onClick={() => setModalTab(tab.type)}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition cursor-pointer border ${
                          isActive
                            ? 'bg-[#EFE3C8] text-[#5C3D1E] border-[#DFC99B] font-bold shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 border-slate-200/70 font-medium'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ô tìm kiếm thực thể */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800">
                  Tìm kiếm thực thể
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập tên sự kiện, nhân vật, địa điểm, lực lượng..."
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-100 transition"
                  />
                </div>
              </div>

              {/* Danh sách kết quả tìm kiếm */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Kết quả từ cơ sở dữ liệu ({modalCandidates.length})</span>
                  <span>
                    Đã chọn:{' '}
                    <b className="text-[#5C3D1E] font-bold">{modalSelectedIds.size}</b>
                  </span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {modalCandidates.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">
                      Không tìm thấy thực thể phù hợp trong cơ sở dữ liệu.
                    </div>
                  ) : (
                    modalCandidates.map((item) => {
                      const isSelected = modalSelectedIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleModalItem(item.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                            isSelected
                              ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox tròn */}
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? 'bg-amber-700 border-amber-700 text-white font-bold text-[10px]'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && '✓'}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {item.name}
                                {item.yearLabel && ` (${item.yearLabel})`}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {item.subtitle || item.typeLabel}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                              TYPE_BADGE_STYLE[item.type] ||
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.typeLabel}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium">
                Đã chọn {modalSelectedIds.size} thực thể
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={modalSelectedIds.size === 0}
                  onClick={handleConfirmAdd}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5C3D1E] hover:bg-[#432c15] text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  Gắn vào sự kiện (+{modalSelectedIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem thông tin chi tiết thực thể */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900">{detailItem.name}</h4>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div>
                <b className="text-slate-700">Phân loại:</b>{' '}
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_BADGE_STYLE[detailItem.type]}`}>
                  {detailItem.typeLabel}
                </span>
              </div>
              {detailItem.yearLabel && (
                <div>
                  <b className="text-slate-700">Niên đại:</b> {detailItem.yearLabel}
                </div>
              )}
              {detailItem.subtitle && (
                <div>
                  <b className="text-slate-700">Mô tả / Ngữ cảnh:</b> {detailItem.subtitle}
                </div>
              )}
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
