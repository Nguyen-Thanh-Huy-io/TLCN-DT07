'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { UserCell } from '@/components/common/UserCell';
import { Badge } from '@/components/common/Badge';
import { ColumnDef } from '@/types/table.types';
import { UserRole, UserStatus, NoticeTone } from '@/constants/enums';
import api, { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { USER_ROLE_LABELS } from '@/services/auth/public-auth.service';

const ROLE_OPTIONS: UserRole[] = [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPERADMIN];

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
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const currentUserId = useAuthSession()?.id ?? null;

  // Đổi vai trò: backend thu hồi phiên cũ của tài khoản đó, người dùng phải đăng nhập lại.
  const changeRole = async (user: UserItem, role: UserRole) => {
    try {
      await api.patch(`/users/${user.id}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      setNotice({ tone: 'ok', text: `Đã đổi vai trò của ${user.username} thành ${USER_ROLE_LABELS[role]}.` });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không thể đổi vai trò.') });
    }
  };

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
        if (item.id === currentUserId) {
          return <Badge tone={tone}>{USER_ROLE_LABELS[item.role] ?? item.role} (bạn)</Badge>;
        }
        return (
          <select
            aria-label={`Vai trò của ${item.username}`}
            value={item.role}
            onChange={(e) => changeRole(item, e.target.value as UserRole)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d0d5dd', background: '#fff' }}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {USER_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        );
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
    <>
    {notice && (
      <div
        role="status"
        style={{
          marginBottom: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: notice.tone === NoticeTone.OK ? '#ecfdf5' : '#fef2f2',
          color: notice.tone === NoticeTone.OK ? '#065f46' : '#991b1b',
        }}
      >
        {notice.text}
      </div>
    )}
    <DataTable<UserItem>
      columns={columns}
      data={users}
      searchPlaceholder="Tìm kiếm tài khoản người dùng..."
      primaryButtonLabel="Thêm người dùng"
      onPrimaryButtonClick={() =>
        setNotice({ tone: 'ok', text: 'Người dùng tự tạo tài khoản ở trang Đăng ký; sau đó đổi vai trò tại đây.' })
      }
      filters={[{ label: 'Vai trò' }, { label: 'Trạng thái' }]}
    />
    </>
  );
}
