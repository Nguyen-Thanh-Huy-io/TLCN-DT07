import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import {
  fetchPeriodBySlug,
  PUBLIC_ROUTE_PREFIX,
} from "@/services/entities/landing.service";

// Ảnh nền mặc định khi giai đoạn/chủ đề/nhân vật chưa có coverImageUrl/imageUrl trong DB.
const FALLBACK_HERO_IMAGE = "/assets/temple.jpg";
const FALLBACK_EVENT_IMAGES = ["/assets/citadel.jpg", "/assets/mountain.jpg", "/assets/hero.jpg"];
const FALLBACK_FIGURE_IMAGE = "/assets/portrait-1.jpg";
const FALLBACK_TOPIC_IMAGE = "/assets/citadel.jpg";

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

function InfoIcon({ type }: { type: "time" | "topics" | "figures" | "events" }) {
  const icon =
    type === "time" ? (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ) : type === "topics" ? (
      <>
        <path d="M7 20V7h10v13M5 20h14M9 7V4h6v3M10 11h1M14 11h1M10 15h1M14 15h1" />
      </>
    ) : type === "figures" ? (
      <>
        <path d="M4 6.5c3-1.2 5.6-.7 8 1.3v11c-2.4-2-5-2.5-8-1.3zM20 6.5c-3-1.2-5.6-.7-8 1.3v11c2.4-2 5-2.5 8-1.3z" />
      </>
    ) : (
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    );

  return (
    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icon}
    </svg>
  );
}

function NotFoundState({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-4 py-6 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[1400px] border border-[#d7c5a1] bg-[rgba(249,245,236,0.86)] shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
        <Header />
        <main className="p-6 md:p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A1E1E]">Giai đoạn lịch sử</p>
          <h1 className="mt-3 font-[Lora] text-3xl font-semibold text-[#501013]">Không tìm thấy giai đoạn lịch sử</h1>
          <p className="mt-3 text-sm text-[#504640]">
            Đường dẫn "{slug}" chưa có dữ liệu xuất bản trong cơ sở dữ liệu.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md border border-[#6e181b] bg-[#6e181b] px-4 py-3 text-xs font-medium text-white transition hover:bg-[#501013]"
          >
            <span>Quay về trang chủ</span>
            <ArrowIcon />
          </Link>
        </main>
      </div>
    </div>
  );
}

export default async function EraDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const period = await fetchPeriodBySlug(slug);

  if (!period) {
    return <NotFoundState slug={slug} />;
  }

  const breadcrumb = ["Trang chủ", "Dòng chảy lịch sử", period.name];

  const info: Array<{ label: string; value: string; icon: "time" | "topics" | "figures" | "events" }> = [
    { label: "Thời gian", value: period.timeLabel, icon: "time" },
    { label: "Chủ đề", value: `${period.topics.length} chủ đề`, icon: "topics" },
    { label: "Nhân vật tiêu biểu", value: `${period.figures.length} nhân vật`, icon: "figures" },
    { label: "Sự kiện", value: `${period.events.length} sự kiện`, icon: "events" },
  ];

  const timeline = period.events.map((event, index) => ({
    key: event.id,
    year: event.eventDateNote || String(event.startYear),
    label: event.title,
    image: FALLBACK_EVENT_IMAGES[index % FALLBACK_EVENT_IMAGES.length],
  }));

  const people = period.figures.map((figure) => ({
    key: figure.id,
    name: figure.name,
    years:
      figure.birthYear != null
        ? `${figure.birthYear} – ${figure.deathYear ?? "nay"}`
        : figure.tagline || "",
    image: figure.imageUrl || FALLBACK_FIGURE_IMAGE,
    href: `${PUBLIC_ROUTE_PREFIX.FIGURE}/${figure.slug}`,
  }));

  const chapters = period.topics.map((topic) => ({
    key: topic.id,
    title: topic.name,
    period: topic.eyebrow || "",
    image: topic.coverImageUrl || FALLBACK_TOPIC_IMAGE,
    href: `${PUBLIC_ROUTE_PREFIX.CHAPTER}/${topic.slug}`,
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-4 py-6 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[1400px] border border-[#d7c5a1] bg-[rgba(249,245,236,0.86)] shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
        <Header />

        <main className="p-3 md:p-6">
          <section className="relative mt-4 overflow-hidden border border-[#d7c5a1] bg-[#f8f3e8]">
            <img
              src={period.coverImageUrl || FALLBACK_HERO_IMAGE}
              alt={period.name}
              className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#faf7ef_0%,#faf7ef_37%,rgba(250,247,239,0.9)_49%,rgba(250,247,239,0.1)_76%)]" />

            <div className="relative z-10 w-full max-w-[54%] p-6 md:p-8 lg:p-10">
              <nav className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-[#83766d] md:text-xs" aria-label="Đường dẫn">
                {breadcrumb.map((item, index) => (
                  <div key={item} className="flex items-center gap-2">
                    {index > 0 && <span>›</span>}
                    {index === breadcrumb.length - 1 ? (
                      <strong className="font-medium text-[#6e181b]">{item}</strong>
                    ) : (
                      <Link href="/" className="text-[#83766d] hover:text-[#6e181b]">
                        {item}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              <h1 className="m-0 font-[Lora] text-[clamp(2.2rem,4vw,3.3rem)] leading-[1.08] tracking-[-1.5px] text-[#501013]">
                {period.name}
              </h1>
              <p className="mt-2 font-[Lora] text-base font-semibold text-[#6e181b]">{period.timeLabel}</p>
              {period.description && (
                <p className="mt-5 max-w-[620px] text-sm leading-7 text-[#504640] md:text-[15px]">{period.description}</p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="#dong-thoi-gian"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#6e181b] bg-[#6e181b] px-4 py-3 text-xs font-medium text-white transition hover:bg-[#501013]"
                >
                  <span>Bắt đầu khám phá</span>
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </section>

          <section id="dong-thoi-gian" className="mt-8 border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3 text-[#6e181b]">
              <span className="inline-block h-3 w-3 rotate-45 bg-[#6e181b]" aria-hidden="true" />
              <h2 className="font-[Lora] text-2xl font-semibold md:text-3xl">Dòng thời gian sự kiện tiêu biểu</h2>
            </div>

            {timeline.length === 0 ? (
              <p className="text-sm text-[#776b61]">Chưa có sự kiện nào được xuất bản cho giai đoạn này.</p>
            ) : (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {timeline.map((event) => (
                  <Link
                    key={event.key}
                    href="#thong-tin"
                    className="group min-w-[220px] flex-1 rounded-lg border border-[#d7c5a1] bg-white/70 p-2 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="mb-3 overflow-hidden rounded-md border border-[#d7c5a1]">
                      <img src={event.image} alt={event.label} className="h-32 w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="font-[Lora] text-xl font-semibold text-[#6e181b]">{event.year}</div>
                    <div className="mt-1 text-sm text-[#302622]">{event.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section id="thong-tin" className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Những thông tin chính</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {info.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 p-3">
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-md bg-[#f2e9d8] text-[#6e181b]">
                        <InfoIcon type={item.icon} />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.08em] text-[#776b61]">{item.label}</div>
                        <div className="mt-1 text-sm font-medium text-[#302622]">{item.value}</div>
                      </div>
                    </div>
                  ))}
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

                {people.length === 0 ? (
                  <p className="text-sm text-[#776b61]">Chưa có nhân vật nào gắn với giai đoạn này.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    {people.map((person) => (
                      <Link key={person.key} href={person.href} className="group rounded-lg border border-[#d7c5a1] bg-white/70 p-2 transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="overflow-hidden rounded-md border border-[#d7c5a1]">
                          <img src={person.image} alt={person.name} className="h-28 w-full object-cover transition duration-300 group-hover:scale-105" />
                        </div>
                        <div className="mt-3 font-[Lora] text-lg font-semibold text-[#6e181b]">{person.name}</div>
                        {person.years && <div className="text-sm text-[#302622]">({person.years})</div>}
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Các chủ đề liên quan</h2>
                {chapters.length === 0 ? (
                  <p className="mt-5 text-sm text-[#776b61]">Chưa có chủ đề nào được xuất bản cho giai đoạn này.</p>
                ) : (
                  <div className="mt-5 grid gap-4">
                    {chapters.map((chapter) => (
                      <Link key={chapter.key} href={chapter.href} className="group flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 p-2 transition hover:-translate-y-0.5 hover:shadow-md">
                        <img src={chapter.image} alt={chapter.title} className="h-16 w-16 rounded-md object-cover" />
                        <div className="flex-1">
                          <div className="font-[Lora] text-lg font-semibold text-[#6e181b]">{chapter.title}</div>
                          {chapter.period && <div className="text-sm text-[#302622]">{chapter.period}</div>}
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
    </div>
  );
}
