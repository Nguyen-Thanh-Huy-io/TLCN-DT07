import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TrueFalseAnswerSelector } from '@/components/common/TrueFalseAnswerSelector';

describe('TrueFalseAnswerSelector component', () => {
  it('hiển thị đúng trạng thái Đúng/Sai và gọi onChange khi chuyển lựa chọn', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(<TrueFalseAnswerSelector value={true} onChange={onChange} compact />);
    expect(screen.getByText(/Đáp án đang chọn: ✓ Đúng/)).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith(false);

    rerender(<TrueFalseAnswerSelector value={false} onChange={onChange} />);
    expect(screen.getByText(/Đáp án đang chọn: ✕ Sai/)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button')[0]);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
