'use client';

import { useEffect, useSyncExternalStore } from 'react';
import api from '@/services/api';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import {
  SAVED_MATERIAL_API,
  SAVED_MATERIAL_CHANGE_EVENT,
  SavedMaterialKind,
  type SavableMaterialKind,
} from '../constants/saved-material.constants';

import {
  EMPTY_SAVED_MATERIAL_SNAPSHOT,
  normalizeSavedMaterialSnapshot,
  unwrapSavedToggleResult,
  type NormalizedSavedMaterialSnapshot,
} from '../utils/saved-material.normalizer';

export type SavedMaterialSnapshot = NormalizedSavedMaterialSnapshot;

let cachedSnapshot: SavedMaterialSnapshot = EMPTY_SAVED_MATERIAL_SNAPSHOT;
let inFlightFetch: Promise<SavedMaterialSnapshot> | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SAVED_MATERIAL_CHANGE_EVENT));
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SavedMaterialSnapshot {
  return cachedSnapshot;
}

function getServerSnapshot(): SavedMaterialSnapshot {
  return EMPTY_SAVED_MATERIAL_SNAPSHOT;
}

/** Nạp lại tư liệu đã lưu từ server; các hook `useSavedMaterialsSnapshot` đang mount sẽ tự cập nhật. */
export async function refetchSavedMaterials(): Promise<SavedMaterialSnapshot> {
  if (!PublicAuthService.getAccessToken()) {
    cachedSnapshot = EMPTY_SAVED_MATERIAL_SNAPSHOT;
    notifyListeners();
    return cachedSnapshot;
  }
  if (!inFlightFetch) {
    inFlightFetch = api
      .get(SAVED_MATERIAL_API.ROOT)
      .then((res) => normalizeSavedMaterialSnapshot(res.data))
      .catch(() => cachedSnapshot)
      .finally(() => {
        inFlightFetch = null;
      });
  }
  const snapshot = await inFlightFetch;
  cachedSnapshot = snapshot;
  notifyListeners();
  return snapshot;
}

/** Hook đồng bộ snapshot tư liệu đã lưu hiện tại; tự nạp lần đầu khi `enabled`. */
export function useSavedMaterialsSnapshot(enabled = true): SavedMaterialSnapshot {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!enabled) return;
    void refetchSavedMaterials();
  }, [enabled]);

  return snapshot;
}

/** Lưu/bỏ lưu một tư liệu (bài viết hoặc bài học); trả về true nếu vừa được lưu. */
export async function toggleSavedMaterial(
  kind: SavableMaterialKind,
  targetId: string,
): Promise<boolean> {
  const res = await api.post(SAVED_MATERIAL_API.TOGGLE, {
    kind,
    targetId,
  });
  await refetchSavedMaterials();
  return unwrapSavedToggleResult(res.data);
}

/** Bỏ lưu trực tiếp một mốc dấu mộc lịch sử đã ghim (tab "Yêu thích"). */
export async function removeSavedTimelineNode(targetId: string): Promise<void> {
  await api.delete(
    SAVED_MATERIAL_API.BY_KIND_AND_TARGET(SavedMaterialKind.TIMELINE_NODE, targetId),
  );
  await refetchSavedMaterials();
}

export function isMaterialSaved(
  snapshot: SavedMaterialSnapshot,
  kind: SavableMaterialKind,
  id: string,
): boolean {
  return kind === SavedMaterialKind.ARTICLE
    ? snapshot.articleIds.includes(id)
    : snapshot.lessonIds.includes(id);
}
