'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/constants/api-url';
import type { CommunityTabKey } from '@/constants/enums';
import type { CommunityMemberSummary, CommunityPost } from '../api';

const SOCKET_URL = API_BASE_URL;

interface UseCommunityRealtimeSocketParams {
  activeTab: CommunityTabKey;
  userId?: string;
  loadTabFeed: (tab: CommunityTabKey) => Promise<void>;
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  setSuggestedMembers: React.Dispatch<React.SetStateAction<CommunityMemberSummary[]>>;
  setRealtimeNotice: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useCommunityRealtimeSocket({
  activeTab,
  userId,
  loadTabFeed,
  setPosts,
  setSuggestedMembers,
  setRealtimeNotice,
}: UseCommunityRealtimeSocketParams) {
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('post:hidden', (payload: { postId?: string }) => {
      const hiddenId = payload?.postId;
      if (!hiddenId) return;

      setPosts((current) => {
        const target = current.find((p) => p.id === hiddenId);
        if (target && userId && target.author?.id === userId) {
          setRealtimeNotice(
            `Bài viết "${target.title}" đã bị hệ thống AI tạm ẩn do phát hiện dấu hiệu vi phạm quy tắc cộng đồng.`,
          );
        }
        return current.filter((p) => p.id !== hiddenId);
      });
    });

    socket.on('post:restored', () => {
      void loadTabFeed(activeTab);
    });

    socket.on('post:like-updated', (payload: { postId?: string; likeCount?: number }) => {
      if (!payload?.postId || typeof payload.likeCount !== 'number') return;
      setPosts((current) =>
        current.map((item) =>
          item.id === payload.postId ? { ...item, likeCount: Math.max(0, payload.likeCount!) } : item,
        ),
      );
    });

    socket.on(
      'user:follow-updated',
      (payload: { targetUserId?: string; followerCount?: number }) => {
        if (!payload?.targetUserId || typeof payload.followerCount !== 'number') return;
        setSuggestedMembers((current) =>
          current.map((m) =>
            m.id === payload.targetUserId
              ? { ...m, followerCount: Math.max(0, payload.followerCount!) }
              : m,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [activeTab, loadTabFeed, setPosts, setRealtimeNotice, setSuggestedMembers, userId]);
}
