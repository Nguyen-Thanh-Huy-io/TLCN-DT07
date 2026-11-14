import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import { UserRole, UserStatus } from '@/constants/enums';

export interface UserItem {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
}

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

/** Quản lý tài khoản — chỉ SUPERADMIN gọi được (backend chặn ở `@RequireRoles`). */
export class UserApiService {
  static async getUsers(query: UserListQuery): Promise<PaginatedResult<UserItem>> {
    const res = await api.get('/users', { params: query });
    return parsePaginatedResponse<UserItem>(res.data);
  }

  static async changeRole(id: string, role: UserRole): Promise<void> {
    await api.patch(`/users/${id}`, { role });
  }
}
