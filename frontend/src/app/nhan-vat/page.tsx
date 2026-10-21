import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { fetchFigures, PUBLIC_ROUTE_PREFIX } from "@/services/entities/landing.service";

const FALLBACK_FIGURE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80";

function LotusMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 60 60" aria-hidden="true" className="text-[#9b7338]">
      <path d="M30 8c-7 10-9 18-9 23 0 9 5 17 9 21 4-4 9-12 9-21 0-5-2-13-9-23Z" fill="currentColor" opacity="0.9" />
      <path d="M17 19c-8 5-11 12-11 18 7-2 13-9 16-18 0 0-2 0-5 0Zm26 0c8 5 11 12 11 18-7-2-13-9-16-18 0 0 2 0 5 0Z" fill="currentColor" opacity="0.8" />
      <path d="M14 31c-5 10-4 18 4 24 7-6 10-14 8-24-5 0-9 0-12 0Zm32 0c5 10 4 18-4 24-7-6-10-14-8-24 5 0 9 0 12 0Z" fill="currentColor" opacity="0.7" />
      <path d="M18 45c6 5 11 7 12 7s6-2 12-7c-5-3-9-4-12-4s-7 1-12 4Z" fill="currentColor" />
    </svg>
  );
}

export default async function NhanVatPage() {
  const figures = await fetchFigures();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.82),transparent_20%),linear-gradient(135deg,#f3ecd9_0%,#fbf7ee_50%,#f2e6cb_100%)] px-3 py-4 md:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden border border-[#d0b27a] bg-[rgba(250,245,235,0.9)] shadow-[0_24px_60px_rgba(73,46,18,0.08)]">
        <Header activeTab="nhan-vat" />

        <div className="relative overflow-hidden border-t border-[#d0b27a] bg-[linear-gradient(180deg,rgba(250,246,238,0.9),rgba(246,239,225,0.94))] px-4 py-6 md:px-8 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(147,93,30,0.08),transparent_28%)]" aria-hidden="true" />
          <div className="relative z-10">
            <section className="pt-3 md:pt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7c1c24]">Di sản Việt Nam</p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.3rem,4vw,4rem)] leading-[1.05] tracking-[-0.04em] text-[#172b46]">
                Khám phá nhân vật lịch sử
              </h1>
              <p className="mt-3 max-w-3xl text-base text-[#4f5e67] md:text-lg">
                Những con người đã định hình bước đi của đất nước, tạo nên tinh thần, trí tuệ và bản sắc của dân tộc Việt Nam.
              </p>
            </section>

            <section className="mt-8 rounded-[16px] border border-[#d0b27a] bg-[#f7f0e0] p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 rounded-full border border-[#d0b27a] bg-white/60 px-4 py-2 text-sm text-[#334a5d] shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4.2 4.2" />
                  </svg>
                  Tìm kiếm nhân vật
                </div>
                <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                  <span className="rounded-full border border-[#d0b27a] bg-white/60 px-3 py-1.5 text-[#172b46]">Nhà Lý</span>
                  <span className="rounded-full border border-[#d0b27a] bg-white/60 px-3 py-1.5 text-[#172b46]">Nhà Trần</span>
                  <span className="rounded-full border border-[#d0b27a] bg-white/60 px-3 py-1.5 text-[#172b46]">Hiện đại</span>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {figures.length === 0 ? (
                <p className="col-span-full text-center text-sm text-[#4f5e67]">
                  Chưa có nhân vật nào được xuất bản.
                </p>
              ) : (
                figures.map((figure) => {
                  const years =
                    figure.birthYear != null
                      ? `${figure.birthYear} – ${figure.deathYear ?? "nay"}`
                      : "";
                  const href = `${PUBLIC_ROUTE_PREFIX.FIGURE}/${figure.slug}`;
                  return (
                    <article key={figure.id} className="group overflow-hidden rounded-[18px] border border-[#d0b27a] bg-[#fffdf8] shadow-[0_12px_24px_rgba(80,52,19,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(80,52,19,0.1)]">
                      <div className="relative h-64 overflow-hidden">
                        <img src={figure.imageUrl || FALLBACK_FIGURE_IMAGE} alt={figure.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#231b10]/65 via-transparent to-transparent" />
                        {years && (
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end px-4 pb-3 text-white">
                            <span className="text-xs font-medium">{years}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-[family-name:var(--font-heading)] text-[1.7rem] leading-none text-[#172b46]">{figure.name}</h2>
                            {figure.tagline && <p className="mt-2 text-sm text-[#4f5e67]">{figure.tagline}</p>}
                          </div>
                          <Link href={href} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d0b27a] bg-[#f8f0df] text-[#7c1c24] transition hover:bg-[#efe0bf]" aria-label={`Xem ${figure.name}`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path d="M5 12h13M13 6l6 6-6 6" />
                            </svg>
                          </Link>
                        </div>

                        {figure.description && (
                          <p className="text-sm leading-6 text-[#4f5e67] line-clamp-3">{figure.description}</p>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
