'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, ExternalLink } from 'lucide-react';
import api from '@/services/api';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=15');
      const data = res.data?.data ?? res.data;
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Bỏ qua lỗi nếu chưa đăng nhập
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling mỗi 30s
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200/60"
        title="Thông báo"
        aria-label="Xem thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-stone-200 bg-white shadow-xl z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
              >
                <Check size={13} /> Đã đọc hết
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">Đang tải thông báo…</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">Bạn chưa có thông báo nào.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkOne(n.id)}
                  className={`p-3.5 transition hover:bg-stone-50 ${!n.isRead ? 'bg-amber-50/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-xs font-semibold text-stone-900 line-clamp-1">{n.title}</strong>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />}
                  </div>
                  <p className="mt-1 text-xs text-stone-600 line-clamp-2">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                    <span>{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                    {n.linkUrl && (
                      <Link
                        href={n.linkUrl}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-0.5 text-amber-700 font-medium hover:underline"
                      >
                        Xem chi tiết <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
