import api from '../api';

export interface TaxonomyTermItem {
  id: string;
  groupCode: string;
  code: string;
  label: string;
  inverseLabel: string | null;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  aliases: string[];
  parentId: string | null;
  isActive: boolean;
}

export interface TaxonomyGroupItem {
  code: string;
  label: string;
  description: string | null;
  multiValued: boolean;
  hierarchical: boolean;
  terms: TaxonomyTermItem[];
}

export type TaxonomyTermInput = Partial<
  Pick<TaxonomyTermItem, 'code' | 'label' | 'inverseLabel' | 'description' | 'icon' | 'displayOrder' | 'aliases' | 'parentId' | 'isActive'>
> & { groupCode?: string };

const unwrap = <T>(res: { data?: { data?: T } & T }) => (res.data?.data ?? res.data) as T;

/** Danh mục dùng chung (taxonomy) — CMS: xem cả giá trị đang ẩn; sửa cần quyền người duyệt. */
export class TaxonomyApiService {
  static async getGroups(): Promise<TaxonomyGroupItem[]> {
    return unwrap(await api.get('/taxonomies'));
  }

  static async createTerm(input: TaxonomyTermInput & { groupCode: string; code: string; label: string }) {
    return unwrap<TaxonomyTermItem>(await api.post('/taxonomies/terms', input));
  }

  static async updateTerm(id: string, input: TaxonomyTermInput) {
    return unwrap<TaxonomyTermItem>(await api.patch(`/taxonomies/terms/${id}`, input));
  }

  static async deleteTerm(id: string) {
    await api.delete(`/taxonomies/terms/${id}`);
  }
}
