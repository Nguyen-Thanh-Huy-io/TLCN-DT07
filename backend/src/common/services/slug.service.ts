import { Injectable } from '@nestjs/common';
import { toSlug, withSuffix } from '../utils/slug.util';

/**
 * Hàm kiểm tra slug đã tồn tại hay chưa.
 * Mỗi module tự cung cấp (DIP) → SlugService không phụ thuộc model cụ thể.
 */
export type SlugExistsChecker = (slug: string) => Promise<boolean>;

const MAX_SLUG_ATTEMPTS = 50;

@Injectable()
export class SlugService {
  async generateUnique(
    source: string,
    exists: SlugExistsChecker,
  ): Promise<string> {
    const base = toSlug(source);
    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
      const candidate = withSuffix(base, attempt);
      if (!(await exists(candidate))) {
        return candidate;
      }
    }
    return withSuffix(base, Date.now());
  }
}
