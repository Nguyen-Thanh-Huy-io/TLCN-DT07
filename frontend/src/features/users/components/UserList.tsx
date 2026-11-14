'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { UserCell } from '@/components/common/CommonUi';
import { Badge } from '@/components/common/CommonUi';
import { ColumnDef } from '@/types/table.types';
import { CommonFilterOption, UserRole, UserStatus, NoticeTone } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { UserApiService, type UserItem } from '@/services/entities/user.service';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { USER_ROLE_LABELS } from '@/services/auth/public-auth.service';

const ROLE_OPTIONS: UserRole[] = [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPERADMIN];

export type { UserItem };

const USERS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const isUserRole = (value: string): value is UserRole =>
  Object.values<string>(UserRole).includes(value);
const isUserStatus = (value: string): value is UserStatus =>
  Object.values<string>(UserStatus).includes(value);

export function UserList() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(CommonFilterOption.ALL);
  const [selectedStatus, setSelectedStatus] = useState<string>(CommonFilterOption.ALL);
  const currentUserId = useAuthSession()?.id ?? null;

  // Đổi vai trò: backend thu hồi phiên cũ của tài khoản đó, người dùng phải đăng nhập lại.
  const changeRole = async (user: UserItem, role: UserRole) => {
    try {
      await UserApiService.changeRole(user.id, role);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      setNotice({ tone: 'ok', text: `Đã đổi vai trò của ${user.username} thành ${USER_ROLE_LABELS[role]}.` });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không thể đổi vai trò.') });
    }
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      UserApiService.getUsers({
        page,
        limit: USERS_PER_PAGE,
        search: search.trim() || undefined,
        role: isUserRole(selectedRole) ? selectedRole : undefined,
        status: isUserStatus(selectedStatus) ? selectedStatus : undefined,
      })
        .then((result) => {
          if (cancelled) return;
          setUsers(result.items);
          setTotalCount(result.total);
          setTotalPages(result.totalPages);
        })
        .catch((err) => {
          if (!cancelled) setLoadError(extractErrorMessage(err, 'Không tải được danh sách người dùng.'));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, search, selectedRole, selectedStatus]);

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

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

  const roleOptions = React.useMemo(
    () => [
      { label: 'Tất cả vai trò', value: CommonFilterOption.ALL },
      ...ROLE_OPTIONS.map((r) => ({
        label: USER_ROLE_LABELS[r] || r,
        value: r,
      })),
    ],
    []
  );

  const statusOptions = React.useMemo(
    () => [
      { label: 'Tất cả trạng thái', value: CommonFilterOption.ALL },
      { label: 'Đang hoạt động', value: UserStatus.ACTIVE },
      { label: 'Tạm khóa', value: UserStatus.INACTIVE },
      { label: 'Bị đình chỉ', value: UserStatus.SUSPENDED },
    ],
    []
  );

  if (loadError) {
    return <div role="alert" style={{ padding: 20, color: '#991b1b' }}>{loadError}</div>;
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
      emptyMessage={loading ? 'Đang tải danh sách người dùng...' : 'Không có tài khoản nào phù hợp.'}
      searchPlaceholder="Tìm theo email hoặc username..."
      searchValue={search}
      onSearchChange={resetToFirstPage(setSearch)}
      totalCount={totalCount}
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
      primaryButtonLabel="Thêm người dùng"
      onPrimaryButtonClick={() =>
        setNotice({ tone: 'ok', text: 'Người dùng tự tạo tài khoản ở trang Đăng ký; sau đó đổi vai trò tại đây.' })
      }
      filters={[
        {
          label: 'Vai trò',
          options: roleOptions,
          selectedValue: selectedRole,
          onSelect: resetToFirstPage(setSelectedRole),
        },
        {
          label: 'Trạng thái',
          options: statusOptions,
          selectedValue: selectedStatus,
          onSelect: resetToFirstPage(setSelectedStatus),
        },
      ]}
    />
    </>
  );
}
