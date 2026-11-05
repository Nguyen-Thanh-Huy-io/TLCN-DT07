import React from 'react';
import Link from 'next/link';
import { Header } from './Header';
import { Footer } from './Footer';

/** Khung trang công khai: Header + nội dung + Footer trên nền giấy. */
export function PublicShell({ activeTab, children }: { activeTab?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2]">
      <Header activeSectionId={activeTab} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/** Trạng thái "không tìm thấy" dùng chung cho các trang chi tiết công khai. */
export function PublicNotFound({
  eyebrow,
  title,
  message,
  backHref = '/',
  backLabel = 'Về trang chủ',
}: {
  eyebrow: string;
  title: string;
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-28 text-center">
      <small className="mb-2 text-xs font-bold uppercase tracking-widest text-[#8C6239]">{eyebrow}</small>
      <h1 className="mb-3 font-serif text-3xl font-bold text-[#2D1A10]">{title}</h1>
      <p className="mb-6 max-w-md text-stone-600">{message}</p>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-full bg-[#8C2D19] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-[#6D2111]"
      >
        ← {backLabel}
      </Link>
    </div>
  );
}

/** Tiêu đề khu vực của trang danh sách công khai. */
export function PublicPageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-stone-200 bg-gradient-to-b from-[#F3EADF] to-[#FAF7F2]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <small className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C6239]">{eyebrow}</small>
        <h1 className="mt-2 font-serif text-4xl font-bold text-[#2D1A10] sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">{description}</p>}
        {children}
      </div>
    </section>
  );
}
