import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { fetchEvents, fetchLocations, PUBLIC_ROUTE_PREFIX } from "@/services/entities/landing.service";

const FALLBACK_LANDMARK_IMAGES = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80",
];

export default async function DiTichPage() {
  const [locations, events] = await Promise.all([fetchLocations(), fetchEvents()]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_15%,rgba(255,255,255,0.7),transparent_22%),linear-gradient(135deg,#f3ebdc_0%,#f8f3e8_50%,#eedfbd_100%)] px-3 py-4 md:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden border border-[#d7c08d] bg-[rgba(250,245,236,0.92)] shadow-[0_30px_70px_rgba(70,46,18,0.08)]">
        <Header activeTab="di-tich" />

        <div className="relative border-t border-[#d7c08d] bg-[linear-gradient(180deg,rgba(250,246,238,0.9),rgba(246,239,225,0.96))] px-4 py-8 md:px-8 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(171,124,52,0.08),transparent_32%)]" aria-hidden="true" />

          <div className="relative z-10">
            <section className="mx-auto max-w-4xl text-center">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7a1d1f]">Di sản Việt Nam</p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,4vw,4rem)] leading-[1.05] tracking-[-0.04em] text-[#231b15]">
                Tìm kiếm theo di tích lịch sử
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base text-[#5e544d] md:text-lg">
                Khám phá những không gian, chiến trường và kinh đô gắn liền với các sự kiện, triều đại và danh nhân của dân tộc.
              </p>
            </section>

            <section className="mt-8">
              <div className="mb-5 flex flex-col gap-3 border-b border-[#dcc39c] pb-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-[family-name:var(--font-heading)] flex items-center gap-3 text-2xl font-bold text-[#231b15] md:text-3xl">
                  <span className="h-6 w-2.5 rounded-sm bg-[#681717]" aria-hidden="true" />
                  Di tích tiêu biểu
                </h2>
                <span className="w-fit rounded-full border border-[#dcc39c] bg-[#fef3c7]/80 px-3 py-1 text-sm font-medium text-[#6a5f53]">
                  Hiển thị {locations.length} địa danh
                </span>
              </div>

              {locations.length === 0 ? (
                <p className="text-sm text-[#6a5f53]">Chưa có di tích nào được xuất bản.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {locations.map((landmark, index) => (
                    <article key={landmark.id} className="flex min-h-[220px] flex-col justify-between rounded-[18px] border border-[#e3d3b3] bg-[#fcfaf5] p-4 shadow-[0_4px_18px_rgba(88,68,40,0.04)]">
                      <div className="flex gap-4">
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[#e6d3b1] bg-[#fef3c7]">
                          <img
                            src={FALLBACK_LANDMARK_IMAGES[index % FALLBACK_LANDMARK_IMAGES.length]}
                            alt={landmark.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-[family-name:var(--font-heading)] text-[1.5rem] leading-6 text-[#231b15]">{landmark.name}</h3>
                          {landmark.address && (
                            <p className="mt-1 text-xs font-medium text-[#6a5f53]">({landmark.address})</p>
                          )}
                          {landmark.latitude != null && landmark.longitude != null && (
                            <div className="mt-2 flex items-center gap-2 text-[11px]">
                              <span className="font-semibold text-[#6a5f53]">Toạ độ:</span>
                              <span className="rounded border border-[#e7d7b7] bg-[#f1e7d4] px-2 py-0.5 text-[10px] font-medium text-[#681717]">
                                {landmark.latitude.toFixed(4)}, {landmark.longitude.toFixed(4)}
                              </span>
                            </div>
                          )}
                          {landmark.historicalSignificance && (
                            <div className="mt-2 text-[12px] leading-5 text-[#231b15]">
                              <span className="font-semibold text-[#6a5f53]">Ý nghĩa: </span>
                              {landmark.historicalSignificance}
                            </div>
                          )}
                        </div>
                      </div>

                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-[18px] border border-[#dcc39c] bg-[#f6efe2] p-5 shadow-sm md:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-[family-name:var(--font-heading)] flex items-center gap-2 text-xl font-bold text-[#231b15] md:text-2xl">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 21s-7-5.4-9.5-8.4C.7 10.9 2.1 6 6.5 6c2.2 0 3.7 1.1 5.5 3.1C13.8 7.1 15.3 6 17.5 6c4.4 0 5.8 4.9 4 6.6C19 15.6 12 21 12 21Z" />
                  </svg>
                  Sự kiện liên quan
                </h2>
                <p className="text-xs italic text-[#6a5f53]">Các chiến công và mốc son chói lọi trong lịch sử dân tộc</p>
              </div>

              {events.length === 0 ? (
                <p className="text-sm text-[#6a5f53]">Chưa có sự kiện nào được xuất bản.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {events.slice(0, 8).map((event) =>
                    event.slug ? (
                      <Link
                        key={event.id}
                        href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${event.slug}`}
                        className="flex items-center gap-3 rounded-lg border border-[#dcc39c] bg-[#faf7f2] px-4 py-3 text-sm font-medium text-[#231b15] transition hover:bg-[#fffdf9]"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6817171a] text-[#681717]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M12 2v20M2 12h20" />
                          </svg>
                        </span>
                        {event.title}
                      </Link>
                    ) : (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 rounded-lg border border-[#dcc39c] bg-[#faf7f2] px-4 py-3 text-sm font-medium text-[#231b15]"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6817171a] text-[#681717]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M12 2v20M2 12h20" />
                          </svg>
                        </span>
                        {event.title}
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
