import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
const mockUseAuthSession = vi.fn();
const mockGetFollowStatus = vi.fn();
const mockToggleFollow = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/services/auth/use-auth-session', () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

vi.mock('@/features/community/api', () => ({
  CommunityApi: {
    getFollowStatus: (...args: unknown[]) => mockGetFollowStatus(...args),
    toggleFollow: (...args: unknown[]) => mockToggleFollow(...args),
  },
}));

import { AuthorFollowButton, AuthorFollowVariant } from '@/components/common/AuthorFollowButton';

describe('AuthorFollowButton component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthSession.mockReturnValue({ id: 'viewer-1', username: 'nguoixem' });
    mockGetFollowStatus.mockResolvedValue({ following: false, followerCount: 12, isMe: false });
  });

  it('tải trạng thái ban đầu và cập nhật lạc quan khi nhấn Theo dõi / Bỏ theo dõi', async () => {
    const user = userEvent.setup();
    mockToggleFollow
      .mockResolvedValueOnce({ following: true, followerCount: 13 })
      .mockResolvedValueOnce({ following: false, followerCount: 12 });

    render(
      <AuthorFollowButton
        authorId="author-2"
        authorUsername="tacgia"
        variant={AuthorFollowVariant.PILL}
      />,
    );

    const btn = await screen.findByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(screen.getByText('(12)')).toBeInTheDocument());

    await user.click(btn);
    expect(mockToggleFollow).toHaveBeenCalledWith('tacgia');
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByText('Đang theo dõi')).toBeInTheDocument();
    expect(screen.getByText('(13)')).toBeInTheDocument();

    await user.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'false'));
  });

  it('hoàn tác trạng thái nếu API toggleFollow thất bại (ca âm)', async () => {
    const user = userEvent.setup();
    mockToggleFollow.mockRejectedValueOnce(new Error('500'));

    render(<AuthorFollowButton authorId="author-2" authorUsername="tacgia" />);

    const btn = await screen.findByRole('button');
    await waitFor(() => expect(screen.getByText('(12)')).toBeInTheDocument());

    await user.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByText('Theo dõi')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('chuyển hướng sang trang đăng nhập nếu khách chưa đăng nhập bấm Theo dõi', async () => {
    const user = userEvent.setup();
    mockUseAuthSession.mockReturnValue(null);

    render(<AuthorFollowButton authorUsername="tacgia" />);

    const btn = await screen.findByRole('button');
    await user.click(btn);

    expect(mockToggleFollow).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/login\?redirect=/));
  });

  it('ẩn nút khi là chính tác giả hoặc thiếu định danh', async () => {
    const { container, rerender } = render(
      <AuthorFollowButton authorId="viewer-1" authorUsername="NGUOIXEM" />,
    );
    expect(container.firstChild).toBeNull();
    expect(mockGetFollowStatus).not.toHaveBeenCalled();

    rerender(<AuthorFollowButton />);
    expect(container.firstChild).toBeNull();
  });
});
