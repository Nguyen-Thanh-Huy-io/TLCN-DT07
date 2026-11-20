'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import {
  categoryKeyLabel,
  eventCategoryKey,
  eventCategoryLabel,
  extractEventCategories,
  type ArticleKind,
  type EventCategoryItem,
} from '@/services/public/article-kind';

export { categoryKeyLabel, eventCategoryKey, eventCategoryLabel, type EventCategoryItem };

interface RawPublicCategory {
  id: string;
  parentId: string | null;
  kind?: ArticleKind | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
}

let cachedEventCategoriesPromise: Promise<EventCategoryItem[]> | null = null;

function loadEventCategories(): Promise<EventCategoryItem[]> {
  if (!cachedEventCategoriesPromise) {
    cachedEventCategoriesPromise = api
      .get('/public/categories')
      .then((res) => {
        const list = (res.data?.data ?? res.data) as RawPublicCategory[];
        return extractEventCategories(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        cachedEventCategoriesPromise = null;
        throw err;
      });
  }
  return cachedEventCategoriesPromise;
}

/** Danh sách các chuyên mục con thuộc loại EVENT (cache theo phiên trang). */
export function useEventCategories(): EventCategoryItem[] {
  const [categories, setCategories] = useState<EventCategoryItem[]>([]);
  useEffect(() => {
    let alive = true;
    loadEventCategories()
      .then((items) => {
        if (alive) setCategories(items);
      })
      .catch(() => {
        if (alive) setCategories([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return categories;
}
