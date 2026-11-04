'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TaxonomyTermItem } from '@/services/entities/taxonomy.service';
import { loadPublicTaxonomy } from './taxonomy-tree';
import { regionOrderFromTerms } from '@/utils/region.utils';

/** Giá trị đang dùng của một nhóm danh mục công khai; rỗng trong lúc tải hoặc khi lỗi. */
export function usePublicTaxonomyTerms(groupCode: string): TaxonomyTermItem[] {
  const [terms, setTerms] = useState<TaxonomyTermItem[]>([]);
  useEffect(() => {
    let alive = true;
    loadPublicTaxonomy(groupCode)
      .then((group) => alive && setTerms(group?.terms ?? []))
      .catch(() => alive && setTerms([]));
    return () => {
      alive = false;
    };
  }, [groupCode]);
  return terms;
}

/** Thứ tự khu vực theo danh mục REGION (dùng cho sortedRegions); chưa tải xong thì thứ tự mặc định. */
export function useRegionOrder(): readonly string[] {
  const terms = usePublicTaxonomyTerms('REGION');
  return useMemo(() => regionOrderFromTerms(terms), [terms]);
}
