'use client';

import Link from 'next/link';
import { useAuthSession } from '@/services/auth/use-auth-session';

export function BlogComposerBar() {
  const currentUser = useAuthSession();
  const name = currentUser?.displayName?.trim() || currentUser?.username?.trim() || 'Bạn';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

  return (
    <div className="mb-8 rounded-[28px] border border-[#d8d0c5] bg-[#f4efe9] p-3 shadow-[0_12px_28px_rgba(32,29,20,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f3e2c8] to-[#d0d9d2] text-sm font-bold text-[#2a352f] shadow-inner">
          {initials}
        </div>

        <Link
          href="/blog/create"
          className="flex flex-1 items-center rounded-full border border-[#ddd2c5] bg-[#f7f2ea] px-4 py-3 text-left text-base text-[#6a6b69] transition hover:border-[#b9804b] hover:text-[#2d352f]"
        >
          What&apos;s on your mind, {name}?
        </Link>
      </div>
    </div>
  );
}
