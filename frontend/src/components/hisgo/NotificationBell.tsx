'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, ExternalLink, X, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '@/services/api';
import { PublicAuthService } from '@/services/auth/public-auth.service';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationBellProps {
  variant?: 'header' | 'topbar';
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'BLOG_COMMENT':
    case 'NEW_REPLY':
      return <MessageSquare size={14} className="text-blue-600" />;
    case 'CONTENT_APPROVED':
      return <CheckCircle size={14} className="text-emerald-600" />;
    case 'CONTENT_REJECTED':
      return <AlertCircle size={14} className="text-rose-600" />;
    default:
      return <Bell size={14} className="text-amber-600" />;
  }
};

const formatRelativeTime = (dateStr: string) => {
  try {
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    const diffSec = Math.max(1, Math.floor((now - then) / 1000));
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return 'Vừa xong';
  }
};

/**
 * Badge hiển thị số lượng thông báo phong cách mạng xã hội (Facebook, X, Instagram)
 * - Tự động hiển thị 99+ nếu vượt quá 99
 * - Có viền trắng nổi bật
 * - Hiệu ứng rung nảy (bump) và sóng lan tỏa (ping) khi có thông báo mới
 */
function NotificationBadge({ count, isBumping }: { count: number; isBumping: boolean }) {
  if (count <= 0) return null;
  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-600 font-extrabold text-white ring-2 ring-white shadow-md transition-all duration-300 pointer-events-none select-none ${
        count > 9 ? 'h-4.5 min-w-[20px] px-1 text-[10px]' : 'h-4.5 w-4.5 text-[11px]'
      } ${isBumping ? 'scale-125 ring-red-300' : 'scale-100'}`}
      style={{ height: '18px', minWidth: count > 9 ? '20px' : '18px' }}
    >
      {/* Sóng ping lan tỏa gây chú ý khi vừa nhận thông báo mới */}
      {isBumping && (
        <span className="absolute inset-0 rounded-full bg-rose-500 opacity-75 animate-ping pointer-events-none" />
      )}
      <span className="relative z-10 leading-none">{displayCount}</span>
    </span>
  );
}

export function NotificationBell({ variant = 'header' }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => PublicAuthService.getCurrentUser());
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const [isBumping, setIsBumping] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bumpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerBump = () => {
    setIsBumping(true);
    if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current);
    bumpTimeoutRef.current = setTimeout(() => setIsBumping(false), 900);
  };

  const fetchNotifications = async () => {
    if (!PublicAuthService.getCurrentUser()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=25');
      const data = res.data?.data ?? res.data;
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Bỏ qua lỗi nếu chưa đăng nhập hoặc mạng tạm thời gián đoạn
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe thay đổi đăng nhập / đăng xuất
  useEffect(() => {
    const unsubscribe = PublicAuthService.subscribe(() => {
      setCurrentUser(PublicAuthService.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  // Thiết lập kết nối Socket.io thời gian thực
  useEffect(() => {
    if (!currentUser?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    fetchNotifications();

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-user-room', { userId: currentUser.id });
    });

    socket.on('notification:new', (newNotif: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((c) => c + 1);

      // Kích hoạt hiệu ứng nảy số và sóng radar
      triggerBump();

      // Hiển thị thông báo nổi (Toast) tức thời
      setToastNotification(newNotif);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToastNotification(null);
      }, 6000);
    });

    return () => {
      socket.emit('leave-user-room', { userId: currentUser.id });
      socket.disconnect();
      socketRef.current = null;
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (bumpTimeoutRef.current) {
        clearTimeout(bumpTimeoutRef.current);
      }
    };
  }, [currentUser?.id]);

  // Polling phụ trợ (mỗi 60s) đề phòng rớt socket
  useEffect(() => {
    if (!currentUser?.id) return;
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  // Lọc theo tab Tất cả / Chưa đọc
  const displayedNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.isRead;
    return true;
  });

  return (
    <>
      <div ref={dropdownRef} className="relative inline-flex items-center">
        {variant === 'topbar' ? (
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) fetchNotifications();
            }}
            className="relative icon-btn focus:outline-none"
            title="Thông báo"
            aria-label="Xem thông báo"
          >
            <Bell size={16} />
            <NotificationBadge count={unreadCount} isBumping={isBumping} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) fetchNotifications();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-200/60 focus:outline-none"
            title="Thông báo"
            aria-label="Xem thông báo"
          >
            <Bell size={18} />
            <NotificationBadge count={unreadCount} isBumping={isBumping} />
          </button>
        )}

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-stone-200/90 bg-white shadow-2xl z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-150">
            {/* Header thông báo */}
            <div className="border-b border-stone-100 bg-stone-50/90 px-4 pt-3.5 pb-2.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-stone-900">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      {unreadCount > 99 ? '99+' : unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    <Check size={13} /> Đã đọc hết
                  </button>
                )}
              </div>

              {/* Bộ lọc Tab phong cách mạng xã hội (Tất cả / Chưa đọc) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    filterTab === 'all'
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterTab === 'unread'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Chưa đọc
                  {unreadCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        filterTab === 'unread' ? 'bg-white/25 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Danh sách thông báo */}
            <div className="max-h-84 overflow-y-auto divide-y divide-stone-100">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">Đang tải thông báo…</div>
              ) : displayedNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  {filterTab === 'unread' ? 'Không có thông báo chưa đọc nào.' : 'Bạn chưa có thông báo nào.'}
                </div>
              ) : (
                displayedNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkOne(n.id)}
                    className={`p-3.5 transition-colors hover:bg-stone-50 cursor-pointer flex items-start gap-3 relative ${
                      !n.isRead ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Icon đại diện tròn nổi bật */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-stone-200/60">
                        {getNotificationIcon(n.type)}
                      </span>
                    </div>

                    {/* Nội dung thông báo */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs text-stone-800 leading-snug">
                        <strong className="font-semibold text-stone-900 mr-1">{n.title}</strong>
                        {n.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-stone-400">
                        <span className="font-medium text-stone-500">{formatRelativeTime(n.createdAt)}</span>
                        {n.linkUrl && (
                          <>
                            <span>•</span>
                            <Link
                              href={n.linkUrl}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkOne(n.id);
                                setOpen(false);
                              }}
                              className="inline-flex items-center gap-0.5 text-amber-700 font-semibold hover:underline"
                            >
                              Xem chi tiết <ExternalLink size={10} />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Chấm xanh mạng xã hội báo chưa đọc */}
                    {!n.isRead && (
                      <span
                        className="absolute right-3.5 top-5 h-2.5 w-2.5 rounded-full bg-blue-600 shadow-sm flex-shrink-0"
                        title="Chưa đọc"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thông báo nổi (Toast) góc dưới màn hình khi có sự kiện thời gian thực */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm w-full rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                {getNotificationIcon(toastNotification.type)}
              </span>
              <strong className="text-xs font-bold text-stone-900">{toastNotification.title}</strong>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-stone-400 hover:text-stone-600 p-0.5 rounded-full"
              aria-label="Đóng"
            >
              <X size={14} />
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-600 line-clamp-2 pl-9">{toastNotification.message}</p>
          {toastNotification.linkUrl && (
            <div className="mt-3 text-right">
              <Link
                href={toastNotification.linkUrl}
                onClick={() => {
                  handleMarkOne(toastNotification.id);
                  setToastNotification(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
              >
                Xem ngay <ExternalLink size={11} />
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
