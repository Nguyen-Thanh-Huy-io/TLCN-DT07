'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowUp,
  Globe,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { extractErrorMessage } from '@/services/api';
import {
  AI_ASSISTANT_WELCOME_MESSAGE,
  AssistantChatRole,
  AssistantEngine,
  resolveContextQuickPrompts,
} from '../constants/ai-assistant.constants';
import { AiAssistantApiService } from '../services/ai-assistant.service';
import {
  AssistantMessageAttachments,
  type ChatMessageItem,
  renderFormattedText,
} from './HisgoAiChatWidgetParts';

const HEADER_ICON_BTN_CLASS =
  'rounded-lg p-1.5 text-white/75 hover:bg-white/15 hover:text-white cursor-pointer';

let chatMsgSeq = 0;
function nextMessageId(prefix: string): string {
  chatMsgSeq += 1;
  return `${prefix}-${Date.now()}-${chatMsgSeq}`;
}

function createInitialMessages(): ChatMessageItem[] {
  return [
    {
      id: 'welcome-msg',
      role: AssistantChatRole.ASSISTANT,
      content: AI_ASSISTANT_WELCOME_MESSAGE,
      quickActions: [
        { label: 'Thẻ ghi nhớ AI', href: '/tai-khoan?tab=the-ghi-nho' },
        { label: 'Sơ đồ tư duy AI', href: '/tai-khoan?tab=so-do-tu-duy' },
        { label: 'Phòng Luyện tập', href: '/luyen-tap' },
      ],
    },
  ];
}

/** Trích xuất tiêu đề và nội dung chính đang hiển thị trên màn hình để AI hiểu ngữ cảnh trang. */
function extractCurrentPageDomContext(): string {
  if (typeof document === 'undefined') return '';
  const headings: string[] = [];
  const root = document.querySelector('main') ?? document.body;
  root.querySelectorAll('h1, h2, h3').forEach((el) => {
    if (el.closest('[role="dialog"]')) return;
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text && text.length >= 3 && !headings.includes(text)) {
      headings.push(text);
    }
  });
  const paragraphs: string[] = [];
  root.querySelectorAll('p').forEach((el) => {
    if (el.closest('[role="dialog"]')) return;
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text && text.length >= 25 && paragraphs.length < 5) {
      paragraphs.push(text);
    }
  });
  return [
    headings.length > 0
      ? `Các mục tiêu đề trên trang: ${headings.slice(0, 8).join(' | ')}`
      : '',
    paragraphs.length > 0 ? `Nội dung chính: ${paragraphs.join(' — ')}` : '',
  ]
    .filter(Boolean)
    .join('. ')
    .slice(0, 1400);
}

const EDITOR_FULLSCREEN_PREFIXES = [
  '/lessons/',
  '/articles/create',
  '/topics/create',
  '/timelines/create',
] as const;

const BLOCKING_OVERLAY_SELECTOR = [
  '[role="dialog"]:not([data-ai-chat-dialog="true"])',
  '[data-fullscreen-studio="true"]',
  'aside[aria-label="Ngăn đọc Bài viết và Bài học"]',
  'aside[aria-label="Bảng thiết kế Sơ đồ tư duy"]',
  '.sk-toc-drawer',
].join(', ');

function useHasBlockingOverlay(pathname: string | null): boolean {
  const [hasOverlay, setHasOverlay] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const check = () => {
      const found = Boolean(document.querySelector(BLOCKING_OVERLAY_SELECTOR));
      setHasOverlay((prev) => (prev === found ? prev : found));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return hasOverlay;
}

/** Biểu tượng Chatbox AI cố định ở góc dưới bên phải mọi trang của HISGO. */
export function HisgoAiChatWidget() {
  const pathname = usePathname();
  const user = useAuthSession();
  const quickPrompts = resolveContextQuickPrompts(pathname, Boolean(user));
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>(
    createInitialMessages,
  );
  const [input, setInput] = useState('');
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasBlockingOverlay = useHasBlockingOverlay(pathname);
  const isEditorRoute = EDITOR_FULLSCREEN_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, open, sending]);

  const handleSend = async (rawText?: string, forceGoogleSearch = false) => {
    const text = (rawText ?? input).trim();
    if (!text || sending) return;

    const effectiveGoogleSearch = forceGoogleSearch || useGoogleSearch;
    if (forceGoogleSearch && !useGoogleSearch) {
      setUseGoogleSearch(true);
    }

    const userMsg: ChatMessageItem = {
      id: nextMessageId('u'),
      role: AssistantChatRole.USER,
      content: text,
    };

    const recentHistory = messages
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    if (!rawText) setInput('');
    setSending(true);

    try {
      const pageContext = extractCurrentPageDomContext();
      const res = await AiAssistantApiService.chat({
        message: text,
        currentPath: pathname || '/',
        ...(pageContext ? { pageContext } : {}),
        history: recentHistory,
        useGoogleSearch: effectiveGoogleSearch,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId('a'),
          role: AssistantChatRole.ASSISTANT,
          content: res.reply,
          engine: res.engine,
          suggestGoogleFallback: res.suggestGoogleFallback,
          retryPrompt: res.suggestGoogleFallback ? text : undefined,
          suggestedLinks: res.suggestedLinks,
          sourceCitations: res.sourceCitations,
          webSources: res.webSources,
          webSearchQueries: res.webSearchQueries,
          quickActions: res.quickActions,
        },
      ]);
    } catch (err) {
      const rawError = extractErrorMessage(err, '');
      const isTechnicalError =
        !rawError ||
        /^(Request failed|timeout of|Network Error|canceled)/i.test(rawError);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId('err'),
          role: AssistantChatRole.ASSISTANT,
          content: isTechnicalError
            ? 'Xin lỗi, kết nối tới Sử Gia AI đang tạm gián đoạn hoặc phản hồi chậm. Bạn vui lòng thử lại sau giây lát nhé!'
            : rawError,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setMessages(createInitialMessages());
  };

  if (!open && (isEditorRoute || hasBlockingOverlay)) {
    return null;
  }

  return (
    <div
      className={`fixed right-3 bottom-4 print:hidden sm:right-5 sm:bottom-6 ${
        open ? 'z-[60]' : 'z-30'
      }`}
    >
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          data-ai-chat-dialog="true"
          aria-label="Trợ lý Sử học AI HISGO"
          className={`fixed inset-x-3 bottom-[4.5rem] flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-2xl border border-[#D4AE67]/70 bg-[#FFFCF5] text-stone-900 shadow-[0_18px_54px_rgba(45,26,16,0.28)] transition-all sm:static sm:inset-auto sm:mb-3 ${
            expanded
              ? 'h-[calc(100dvh-5.5rem)] sm:h-[min(740px,calc(100dvh-6.5rem))] sm:w-[580px]'
              : 'h-[min(560px,calc(100dvh-5.5rem))] sm:h-[min(600px,calc(100dvh-6.5rem))] sm:w-[440px]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#D4AE67]/35 bg-gradient-to-r from-[#4E1015] via-[#65171D] to-[#4E1015] px-5 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#C99C48] to-[#B8893F] text-[#3D0A0E] shadow-xs">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-[family-name:var(--font-heading)] text-base font-extrabold text-[#FFF6E3]">
                  Sử Gia AI · Trợ lý HISGO
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReset}
                title="Làm mới đoạn hội thoại"
                className={HEADER_ICON_BTN_CLASS}
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                title={expanded ? 'Thu nhỏ khung chat' : 'Mở rộng khung chat'}
                className={`hidden sm:inline-flex ${HEADER_ICON_BTN_CLASS}`}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Đóng hộp thoại"
                aria-label="Đóng hộp thoại"
                className={HEADER_ICON_BTN_CLASS}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4 text-sm"
          >
            {messages.map((msg) => {
              const isUser = msg.role === AssistantChatRole.USER;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                      isUser
                        ? 'rounded-br-xs bg-gradient-to-r from-[#7A1F24] to-[#91252B] text-white'
                        : 'rounded-bl-xs border border-[var(--border,#E2D5B8)] bg-white text-stone-800'
                    }`}
                  >
                    {isUser ? (
                      <p>{msg.content}</p>
                    ) : (
                      <>
                        {(msg.engine === AssistantEngine.VERTEX_RAG ||
                          msg.engine === AssistantEngine.GOOGLE_GROUNDED) && (
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                msg.engine === AssistantEngine.GOOGLE_GROUNDED
                                  ? 'border-sky-300 bg-sky-50 text-sky-900'
                                  : 'border-[#D4AE67]/70 bg-[#FAF5E6] text-[#7A1F24]'
                              }`}
                            >
                              {msg.engine === AssistantEngine.GOOGLE_GROUNDED ? (
                                <>
                                  <Globe size={10} /> Google Search
                                </>
                              ) : (
                                <>
                                  <Sparkles size={10} /> HISGO RAG
                                </>
                              )}
                            </span>
                          </div>
                        )}
                        {renderFormattedText(msg.content)}
                        <AssistantMessageAttachments
                          links={msg.suggestedLinks}
                          citations={msg.sourceCitations}
                          webSources={msg.webSources}
                          webSearchQueries={msg.webSearchQueries}
                          actions={msg.quickActions}
                          suggestGoogleFallback={msg.suggestGoogleFallback}
                          retryPrompt={msg.retryPrompt}
                          onRetryWithGoogle={(prompt) =>
                            void handleSend(prompt, true)
                          }
                          onNavigate={() => setOpen(false)}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2.5 rounded-2xl border border-[var(--border,#E2D5B8)] bg-white px-4 py-3 text-sm text-stone-600">
                  <Loader2 size={15} className="animate-spin text-[#7A1F24]" />
                  <span>
                    {useGoogleSearch
                      ? 'Sử Gia AI đang đối chiếu nguồn Google Search…'
                      : 'Sử Gia AI đang tra cứu kho tư liệu HISGO…'}
                  </span>
                </div>
              </div>
            )}

            {messages.length <= 2 && !sending && (
              <div className="space-y-2 pt-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Gợi ý hỏi nhanh
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void handleSend(item.prompt)}
                      className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3.5 py-2 text-left text-xs font-semibold text-stone-700 transition hover:border-[var(--gold,#B8893F)] hover:bg-[var(--bg-page,#F5EEDC)]/60 hover:text-[#7A1F24] cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="space-y-2 border-t border-[var(--border,#E2D5B8)] bg-white p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-pressed={useGoogleSearch}
                onClick={() => setUseGoogleSearch((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  useGoogleSearch
                    ? 'border-sky-600 bg-sky-600 text-white shadow-2xs'
                    : 'border-stone-300 bg-stone-100 text-stone-700 hover:border-stone-400'
                }`}
              >
                <Globe size={12} />
                <span>Google</span>
                <span
                  className={`rounded px-1 py-0.2 text-[9.5px] font-extrabold uppercase ${
                    useGoogleSearch
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {useGoogleSearch ? 'ON' : 'OFF'}
                </span>
              </button>
              <span className="truncate text-[11px] text-stone-500">
                {useGoogleSearch
                  ? 'Tra cứu mở rộng kèm link nguồn web'
                  : 'Chỉ dùng tư liệu kiểm chứng HISGO'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-[#FFFCF5] px-3.5 py-2.5 focus-within:border-[var(--gold,#B8893F)]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === KeyboardKey.ESCAPE) setOpen(false);
                }}
                maxLength={1500}
                placeholder={
                  useGoogleSearch
                    ? 'Tra cứu lịch sử mở rộng qua Google Search…'
                    : 'Hỏi trong kho tư liệu lịch sử HISGO…'
                }
                className="min-w-0 flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Gửi tin nhắn"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-r from-[#7A1F24] to-[#B8893F] text-white shadow-2xs transition hover:brightness-110 disabled:opacity-35 cursor-pointer"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Đóng Trợ lý AI' : 'Mở Trợ lý Sử học AI HISGO'}
          title="Trợ lý Sử học AI HISGO"
          className="group relative grid size-12 place-items-center rounded-full border-2 border-[#D4AE67] bg-gradient-to-br from-[#7A1F24] via-[#91252B] to-[#5E1519] text-[#FFF6E3] shadow-[0_8px_28px_rgba(122,31,36,0.42)] transition-all duration-200 hover:scale-105 hover:brightness-110 cursor-pointer"
        >
          {open ? (
            <X size={20} />
          ) : (
            <>
              <MessageCircle size={21} className="text-[#FFF6E3]" />
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#D4AE67] text-[#3D0A0E] shadow-xs">
                <Sparkles size={10} />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
