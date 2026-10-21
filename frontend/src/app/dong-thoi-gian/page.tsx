import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { TimelineExplorer } from "@/components/hisgo/TimelineExplorer";
import {
  fetchEvents,
  fetchFigures,
  fetchLandingContent,
  fetchPeriods,
  PUBLIC_ROUTE_PREFIX,
} from "@/services/entities/landing.service";

const FALLBACK_EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1553851919-596510268b99?auto=format&fit=crop&w=700&q=82",
  "https://images.unsplash.com/photo-1784106237009-856d26d83f0c?auto=format&fit=crop&w=700&q=82",
  "https://images.unsplash.com/photo-1710611296324-e4e71240aaf2?auto=format&fit=crop&w=700&q=82",
];
const FALLBACK_FIGURE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=82";

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      style={{ transform: direction === "left" ? "rotate(180deg)" : undefined }}
    >
      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default async function DongThoiGianPage() {
  const [events, figures, landing, allPeriods] = await Promise.all([
    fetchEvents(),
    fetchFigures(),
    fetchLandingContent(),
    fetchPeriods(),
  ]);

  const featuredFigures = figures.slice(0, 3);
  const relatedPeriods = landing.eras.slice(0, 4);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-4 py-6 md:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[1400px] border border-[#d7c5a1] bg-[rgba(249,245,236,0.86)] shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
        <Header activeSectionId="timeline" />

        <main className="p-3 md:p-6">
          <section className="relative mt-4 overflow-hidden border border-[#d7c5a1] bg-[#f8f3e8] p-6 md:p-8 lg:p-10">
            <nav className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-[#83766d] md:text-xs" aria-label="Đường dẫn">
              <Link href="/" className="hover:text-[#6e181b]">Trang chủ</Link>
              <span>›</span>
              <strong className="font-medium text-[#6e181b]">Dòng thời gian</strong>
            </nav>

            <h1 className="m-0 font-[Lora] text-[clamp(2.2rem,4vw,3.3rem)] leading-[1.08] tracking-[-1.5px] text-[#501013]">
              Dòng thời gian lịch sử Việt Nam
            </h1>
            <p className="mt-5 max-w-[720px] text-sm leading-7 text-[#504640] md:text-[15px]">
              Toàn bộ các mốc sự kiện lịch sử đã được xuất bản, sắp xếp theo trình tự thời gian — từ các cuộc kháng chiến giữ nước đến những dấu mốc dựng xây đất nước.
            </p>
          </section>

          <section className="mt-8 border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
            <div className="mb-4 flex items-center gap-3 text-[#6e181b]">
              <span className="inline-block h-3 w-3 rotate-45 bg-[#6e181b]" aria-hidden="true" />
              <h2 className="font-[Lora] text-2xl font-semibold md:text-3xl">Trục thời gian tương tác</h2>
            </div>
            <TimelineExplorer
              periods={allPeriods.map((p) => ({
                id: p.id,
                slug: p.slug,
                name: p.name,
                startYear: p.startYear,
                timeLabel: p.timeLabel,
              }))}
              events={events.map((e) => ({
                id: e.id,
                slug: e.slug,
                title: e.title,
                startYear: e.startYear,
                eventDateNote: e.eventDateNote,
                category: e.category,
                periodSlug: e.periodSlug,
              }))}
            />
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section id="dong-thoi-gian" className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <div className="mb-6 flex items-center gap-3 text-[#6e181b]">
                  <span className="inline-block h-3 w-3 rotate-45 bg-[#6e181b]" aria-hidden="true" />
                  <h2 className="font-[Lora] text-2xl font-semibold md:text-3xl">Các sự kiện tiêu biểu</h2>
                  <span className="ml-auto rounded-full border border-[#d7c5a1] bg-white/60 px-3 py-1 text-xs font-medium text-[#6e181b]">
                    {events.length} sự kiện
                  </span>
                </div>

                {events.length === 0 ? (
                  <p className="text-sm text-[#776b61]">Chưa có sự kiện nào được xuất bản.</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div
                        key={event.id}
                        id={event.slug || undefined}
                        className="flex gap-4 rounded-lg border border-[#d7c5a1] bg-white/70 p-3 scroll-mt-24"
                      >
                        <div className="w-28 shrink-0 overflow-hidden rounded-md border border-[#d7c5a1]">
                          <img
                            src={FALLBACK_EVENT_IMAGES[index % FALLBACK_EVENT_IMAGES.length]}
                            alt={event.title}
                            className="h-20 w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-[Lora] text-lg font-semibold text-[#6e181b]">
                            {event.eventDateNote || `Năm ${event.startYear}`}
                          </div>
                          {event.slug ? (
                            <Link
                              href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${event.slug}`}
                              className="mt-0.5 block text-base font-medium text-[#302622] hover:text-[#6e181b] hover:underline"
                            >
                              {event.title}
                            </Link>
                          ) : (
                            <div className="mt-0.5 text-base font-medium text-[#302622]">{event.title}</div>
                          )}
                          {event.location && (
                            <div className="mt-1 text-xs text-[#776b61]">📍 {event.location}</div>
                          )}
                          {event.description && (
                            <p className="mt-2 text-sm leading-6 text-[#504640] line-clamp-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Tài liệu tham khảo</h2>
                <div className="mt-5 space-y-3 text-sm text-[#302622]">
                  <a href="https://vi.wikipedia.org/wiki/L%E1%BB%8Bch_s%E1%BB%AD_Vi%E1%BB%87t_Nam" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-3 py-3 hover:bg-[#f2e9d8]">
                    <span className="text-[#6e181b]">▮</span>
                    <span>Lịch sử Việt Nam — Tổng quan</span>
                  </a>
                  <a href="https://vi.wikipedia.org/wiki/Vi%E1%BB%87t_Nam_s%E1%BB%AD_l%C6%B0%E1%BB%A3c" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-3 py-3 hover:bg-[#f2e9d8]">
                    <span className="text-[#6e181b]">▮</span>
                    <span>Việt Nam sử lược</span>
                  </a>
                  <a href="https://baotanglichsu.vn/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-3 py-3 hover:bg-[#f2e9d8]">
                    <span className="text-[#6e181b]">♟</span>
                    <span>Bảo tàng Lịch sử Quốc gia</span>
                  </a>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section id="nhan-vat" className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Nhân vật tiêu biểu</h2>
                  <Link href="/nhan-vat" aria-label="Xem tất cả nhân vật" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7c5a1] text-[#6e181b] hover:bg-[#f2e9d8]">
                    <ArrowIcon />
                  </Link>
                </div>

                {featuredFigures.length === 0 ? (
                  <p className="text-sm text-[#776b61]">Chưa có nhân vật nào được xuất bản.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    {featuredFigures.map((figure) => (
                      <Link
                        key={figure.id}
                        href={`${PUBLIC_ROUTE_PREFIX.FIGURE}/${figure.slug}`}
                        className="group rounded-lg border border-[#d7c5a1] bg-white/70 p-2 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="overflow-hidden rounded-md border border-[#d7c5a1]">
                          <img
                            src={figure.imageUrl || FALLBACK_FIGURE_IMAGE}
                            alt={figure.name}
                            className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="mt-3 font-[Lora] text-lg font-semibold text-[#6e181b]">{figure.name}</div>
                        {figure.tagline && <div className="text-sm text-[#302622]">{figure.tagline}</div>}
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Giai đoạn liên quan</h2>
                {relatedPeriods.length === 0 ? (
                  <p className="mt-5 text-sm text-[#776b61]">Chưa có giai đoạn nào được xuất bản.</p>
                ) : (
                  <div className="mt-5 grid gap-4">
                    {relatedPeriods.map((era) => (
                      <Link key={era.id} href={era.href} className="group flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 p-2 transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex-1">
                          <div className="font-[Lora] text-lg font-semibold text-[#6e181b]">{era.title}</div>
                          <div className="text-sm text-[#302622]">{era.period}</div>
                        </div>
                        <ArrowIcon />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </main>
  );
}
