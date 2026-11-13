'use client';

import React, { useState } from 'react';
import { Bookmark, Highlighter, Check, Copy, Edit2, Plus, Quote, Sparkles, Trash2, X } from 'lucide-react';
import { useNoteFacade } from '../facades/useNoteFacade';
import { NOTE_COLOR, NOTE_TARGET_TYPE, NOTE_COLOR_STYLES, NoteColorValue, NoteItem, NoteTargetTypeValue } from '../services/note.service';
import { CommonFilterOption } from '@/constants/enums';

// === NoteFloatingButton.tsx ===
interface NoteFloatingButtonProps {
  facade: ReturnType<typeof useNoteFacade>;
}

export function NoteFloatingButton({ facade }: NoteFloatingButtonProps) {
  const { allNotesCount, selectedHighlight, openDrawer, isOpen } = facade;

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip gợi ý khi có đoạn bôi đen */}
      {selectedHighlight && (
        <button
          type="button"
          onClick={() => openDrawer(true)}
          className="px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs font-medium shadow-lg hover:bg-stone-800 transition-all flex items-center gap-1.5 animate-bounce cursor-pointer border border-white/20"
        >
          <Highlighter size={13} className="text-[#E5B869]" /> Tạo ghi chú từ đoạn chọn
        </button>
      )}

      {/* Nút bấm sổ ghi chú */}
      <button
        type="button"
        onClick={() => openDrawer(false)}
        className="group relative flex items-center gap-2 px-3.5 py-3 rounded-full bg-[#8B261E] text-white shadow-xl hover:bg-[#721F18] hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-white/30"
        title="Mở sổ ghi chú cá nhân"
      >
        <Bookmark size={18} className="transition-transform group-hover:rotate-6" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline">Ghi chú</span>

        {allNotesCount > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-white text-[#8B261E] font-bold text-[11px] flex items-center justify-center shadow-xs">
            {allNotesCount}
          </span>
        )}
      </button>
    </div>
  );
}

// === NoteDrawer.tsx ===
interface NoteDrawerProps {
  facade: ReturnType<typeof useNoteFacade>;
  targetTitle?: string;
  targetType: NoteTargetTypeValue;
}

export function NoteDrawer({ facade, targetTitle, targetType }: NoteDrawerProps) {
  const {
    notes,
    allNotesCount,
    loading,
    isOpen,
    selectedHighlight,
    colorFilter,
    setColorFilter,
    setSelectedHighlight,
    closeDrawer,
    addNote,
    editNote,
    removeNote,
  } = facade;

  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColorValue>(NOTE_COLOR.YELLOW);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setSubmitting(true);
      await addNote(
        newContent,
        newTitle.trim() || undefined,
        selectedColor,
        selectedHighlight || undefined
      );
      setNewContent('');
      setNewTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (note: NoteItem) => {
    if (!editContent.trim()) return;
    await editNote(note.id, { content: editContent.trim() });
    setEditingId(null);
  };

  const handleCopyNote = (note: NoteItem) => {
    const textToCopy = `${note.highlightText ? `> "${note.highlightText}"\n\n` : ''}${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeDrawer}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8B261E]/10 text-[#8B261E] flex items-center justify-center font-bold">
                <Bookmark size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  Sổ Ghi Chú Cá Nhân
                  <span className="px-1.5 py-0.2 rounded-full bg-[#8B261E] text-white text-[10px]">
                    {allNotesCount}
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500 line-clamp-1 max-w-[240px]">
                  {targetTitle || (targetType === NOTE_TARGET_TYPE.ARTICLE ? 'Bài viết lịch sử' : 'Bài học')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Form Tạo Ghi Chú Mới */}
            <form
              onSubmit={handleCreateNote}
              className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B261E] flex items-center gap-1">
                  <Plus size={14} /> Ghi chú mới
                </span>

                {/* Chọn màu sắc note */}
                <div className="flex items-center gap-1.5">
                  {Object.entries(NOTE_COLOR).map(([colorKey, colorVal]) => {
                    const isSelected = selectedColor === colorVal;
                    const style = NOTE_COLOR_STYLES[colorVal];
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setSelectedColor(colorVal)}
                        className={`w-5 h-5 rounded-full ${style.dot} transition-transform cursor-pointer ${
                          isSelected ? 'ring-2 ring-stone-800 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={`Màu ${colorKey}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Trích dẫn đoạn văn bản vừa bôi đen (nếu có) */}
              {selectedHighlight && (
                <div className="relative p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                  <Quote size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="line-clamp-3 italic pr-4">{selectedHighlight}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedHighlight('')}
                    className="absolute top-1.5 right-1.5 text-stone-400 hover:text-rose-600"
                    title="Bỏ trích dẫn này"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Nhập ghi chú, suy nghĩ hoặc kiến thức cần nhớ..."
                rows={3}
                required
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B261E]/30 focus:border-[#8B261E] transition-all"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Highlighter size={12} /> Bôi đen chữ trên bài để trích dẫn
                </div>
                <button
                  type="submit"
                  disabled={submitting || !newContent.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#8B261E] text-white font-bold text-xs hover:bg-[#721F18] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
              </div>
            </form>

            {/* Bộ lọc màu */}
            {allNotesCount > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Lọc ghi chú
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setColorFilter(CommonFilterOption.ALL)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      colorFilter === CommonFilterOption.ALL
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                  >
                    Tất cả
                  </button>
                  {Object.entries(NOTE_COLOR).map(([colorKey, colorVal]) => {
                    const isSelected = colorFilter === colorVal;
                    const style = NOTE_COLOR_STYLES[colorVal];
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setColorFilter(colorVal)}
                        className={`w-4 h-4 rounded-full ${style.dot} cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-stone-800 scale-110' : 'opacity-60 hover:opacity-100'
                        }`}
                        title={colorKey}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Danh sách ghi chú */}
            {loading ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Đang tải ghi chú...
              </div>
            ) : notes.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-stone-200 text-stone-500 bg-white/60">
                <Sparkles size={28} className="mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-semibold text-stone-700">Chưa có ghi chú nào</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Bôi đen đoạn văn bản và lưu lại những điểm cốt lõi để ôn tập nhanh chóng.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const style = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.YELLOW;
                  const isEditing = editingId === note.id;

                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-xl border ${style.border} ${style.bg} transition-all relative group shadow-2xs`}
                    >
                      {/* Trích dẫn */}
                      {note.highlightText && (
                        <div className="mb-2 pl-2.5 border-l-2 border-stone-400/50 text-[11px] italic text-stone-600 line-clamp-3">
                          &ldquo;{note.highlightText}&rdquo;
                        </div>
                      )}

                      {/* Nội dung ghi chú */}
                      {isEditing ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-2 rounded border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 rounded text-[11px] text-stone-600 hover:bg-stone-200 cursor-pointer"
                            >
                              Huỷ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(note)}
                              className="px-2.5 py-1 rounded bg-stone-900 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-xs sm:text-sm font-medium ${style.text} whitespace-pre-wrap leading-relaxed`}>
                          {note.content}
                        </p>
                      )}

                      {/* Footer card */}
                      <div className="mt-3 pt-2 border-t border-stone-200/50 flex items-center justify-between text-[10px] text-stone-500">
                        <span>
                          {new Date(note.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopyNote(note)}
                            className="p-1 rounded hover:bg-white/60 text-stone-600 cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            {copiedId === note.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(note.id);
                              setEditContent(note.content);
                            }}
                            className="p-1 rounded hover:bg-white/60 text-stone-600 cursor-pointer"
                            title="Sửa ghi chú"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn xoá ghi chú này?')) {
                                removeNote(note.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-rose-100 text-stone-600 hover:text-rose-700 cursor-pointer"
                            title="Xoá ghi chú"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
