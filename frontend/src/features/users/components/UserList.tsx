'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { UserCell } from '@/components/common/UserCell';
import { Badge } from '@/components/common/Badge';
import { ColumnDef } from '@/types/table.types';
import { UserRole, UserStatus } from '@/constants/enums';
import api from '@/services/api';

export interface UserItem {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
}


export function UserList() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/users')
      .then((res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        // Danh sách rỗng là trạng thái hợp lệ — không thay bằng dữ liệu mẫu giả.
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch users:', err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnDef<UserItem>[] = [
    {
      header: 'NGƯỜI DÙNG',
      cell: (item) => {
        const initials = (item.fullName || item.username)
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(-2)
          .toUpperCase();
        return (
          <UserCell
            initials={initials || 'US'}
            name={item.fullName || item.username}
          />
        );
      },
    },
    {
      header: 'EMAIL',
      accessorKey: 'email',
    },
    {
      header: 'VAI TRÒ',
      cell: (item) => {
        const roleToneMap: Record<UserRole, 'red' | 'amber' | 'blue' | 'gray'> = {
          [UserRole.SUPERADMIN]: 'red',
          [UserRole.ADMIN]: 'amber',
          [UserRole.MODERATOR]: 'blue',
          [UserRole.USER]: 'gray',
        };
        const tone = roleToneMap[item.role] || 'gray';
        return <Badge tone={tone}>{item.role}</Badge>;
      },
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => (
        <Badge tone={item.status === UserStatus.ACTIVE ? 'green' : 'gray'}>
          {item.status === UserStatus.ACTIVE ? 'Hoạt động' : 'Tạm khóa'}
        </Badge>
      ),
    },
    {
      header: 'NGÀY TẠO',
      cell: (item) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString('vi-VN')
          : '—',
    },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải danh sách người dùng...</div>;
  }

  return (
    <DataTable<UserItem>
      columns={columns}
      data={users}
      searchPlaceholder="Tìm kiếm tài khoản người dùng..."
      primaryButtonLabel="Thêm người dùng"
      onPrimaryButtonClick={() => alert('Thêm người dùng mới')}
      filters={[{ label: 'Vai trò' }, { label: 'Trạng thái' }]}
    />
  );
}
