'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import {
  categoryKeyLabel,
  eventCategoryKey,
  eventCategoryLabel,
  extractEventCategories,
  type EventCategoryItem,
} from '@/services/public/public-content.service';

export {
  categoryKeyLabel,
  eventCategoryKey,
  eventCategoryLabel,
  extractEventCategories,
  type EventCategoryItem,
};

let cachedEventCategoriesPromise: Promise<EventCategoryItem[]> | null = null;

function loadEventCategories(): Promise<EventCategoryItem[]> {
  if (!cachedEventCategoriesPromise) {
    cachedEventCategoriesPromise = api
      .get('/public/categories')
      .then((res) => {
        const list = (res.data?.data ?? res.data) as EventCategoryItem[];
        return extractEventCategories(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        cachedEventCategoriesPromise = null;
        throw err;
      });
  }
  return cachedEventCategoriesPromise;
}

/** Danh sách các chuyên mục con thuộc nhánh Sự kiện (`su-kien`, cache theo phiên trang). */
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
