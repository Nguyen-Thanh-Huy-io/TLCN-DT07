import Link from 'next/link';
import { ImageIcon, Smile, SendHorizonal } from 'lucide-react';

export function BlogComposerBar() {
  return (
    <div className="mb-8 rounded-[28px] border border-[#d8d0c5] bg-[#f4efe9] p-3 shadow-[0_12px_28px_rgba(32,29,20,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f3e2c8] to-[#d0d9d2] text-sm font-bold text-[#2a352f] shadow-inner">
          H
        </div>

        <Link
          href="/blog/create"
          className="flex flex-1 items-center rounded-full border border-[#ddd2c5] bg-[#f7f2ea] px-4 py-3 text-left text-base text-[#6a6b69] transition hover:border-[#b9804b] hover:text-[#2d352f]"
        >
          What&apos;s on your mind, Huy?
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Add photo"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f2e9] text-[#3d6f4d] transition hover:scale-[1.02]"
          >
            <ImageIcon size={18} />
          </button>
          <button
            type="button"
            aria-label="Add emoji"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8e8d5] text-[#9f6a2d] transition hover:scale-[1.02]"
          >
            <Smile size={18} />
          </button>
          <button
            type="button"
            aria-label="Send post"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f2a2b] text-[#f8f2eb] transition hover:bg-[#8a4d2d]"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
