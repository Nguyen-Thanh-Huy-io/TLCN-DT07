import Link from "next/link";
import { Header } from "@/components/hisgo/Header";

const timelineEvents = [
  { year: "1009", label: "Lý Công Uẩn lên ngôi", image: "https://images.unsplash.com/photo-1553851919-596510268b99?auto=format&fit=crop&w=700&q=82" },
  { year: "1010", label: "Dời đô ra Thăng Long", image: "https://images.unsplash.com/photo-1784106237009-856d26d83f0c?auto=format&fit=crop&w=700&q=82" },
  { year: "1075", label: "Chiến thắng Ung Châu", image: "https://images.unsplash.com/photo-1710611296324-e4e71240aaf2?auto=format&fit=crop&w=700&q=82" },
  { year: "1225", label: "Trần Thái Tông lên ngôi", image: "https://images.unsplash.com/photo-1618165220283-e85246c4171c?auto=format&fit=crop&w=700&q=82" },
  { year: "1285", label: "Kháng chiến chống Nguyên", image: "https://images.unsplash.com/photo-1687585102149-08a4bd425052?auto=format&fit=crop&w=700&q=82" },
  { year: "1400", label: "Kết thúc nhà Trần", image: "https://images.unsplash.com/photo-1787555545394-83c8908e1e43?auto=format&fit=crop&w=700&q=82" },
];

const people = [
  { name: "Lý Công Uẩn", years: "974 – 1028", dynasty: "Nhà Lý", image: "https://images.unsplash.com/photo-1553851919-596510268b99?auto=format&fit=crop&w=700&q=82" },
  { name: "Trần Hưng Đạo", years: "1228 – 1300", dynasty: "Nhà Trần", image: "https://images.unsplash.com/photo-1666358861307-b50b70050744?auto=format&fit=crop&w=700&q=82" },
  { name: "Lý Thường Kiệt", years: "1019 – 1105", dynasty: "Nhà Lý", image: "https://images.unsplash.com/photo-1787555545394-83c8908e1e43?auto=format&fit=crop&w=700&q=82" },
];

const infoCards = [
  { label: "Thời gian", value: "1009 – 1400", icon: "time" },
  { label: "Kinh đô", value: "Thăng Long", icon: "capital" },
  { label: "Triều đại", value: "Lý, Trần", icon: "dynasty" },
  { label: "Đặc điểm", value: "Phát triển văn hóa, nghệ thuật, chống ngoại xâm", icon: "star" },
];

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

function InfoIcon({ type }: { type: string }) {
  const icon =
    type === "time" ? (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ) : type === "capital" ? (
      <>
        <path d="M7 20V7h10v13M5 20h14M9 7V4h6v3M10 11h1M14 11h1M10 15h1M14 15h1" />
      </>
    ) : type === "dynasty" ? (
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

export default function DongThoiGianPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-4 py-6 md:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[1400px] border border-[#d7c5a1] bg-[rgba(249,245,236,0.86)] shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
        <Header activeSectionId="timeline" />

        <main className="p-3 md:p-6">
          <section className="relative mt-4 overflow-hidden border border-[#d7c5a1] bg-[#f8f3e8]">
            <img
              src="https://images.unsplash.com/photo-1786890427451-06d2701109db?auto=format&fit=crop&w=1600&q=88"
              alt="Thăng Long thời Lý – Trần"
              className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#faf7ef_0%,#faf7ef_37%,rgba(250,247,239,0.9)_49%,rgba(250,247,239,0.1)_76%)]" />

            <div className="relative z-10 w-full max-w-[54%] p-6 md:p-8 lg:p-10">
              <nav className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-[#83766d] md:text-xs" aria-label="Đường dẫn">
                <Link href="/" className="hover:text-[#6e181b]">Trang chủ</Link>
                <span>›</span>
                <Link href="/dong-thoi-gian" className="hover:text-[#6e181b]">Các triều đại</Link>
                <span>›</span>
                <strong className="font-medium text-[#6e181b]">Thời Lý – Trần</strong>
              </nav>

              <h1 className="m-0 font-[Lora] text-[clamp(2.2rem,4vw,3.3rem)] leading-[1.08] tracking-[-1.5px] text-[#501013]">
                Thời Lý – Trần:
                <br />
                Kỷ nguyên Đại Việt
              </h1>
              <p className="mt-2 font-[Lora] text-base font-semibold text-[#6e181b]">(1009 – 1400)</p>
              <p className="mt-5 max-w-[620px] text-sm leading-7 text-[#504640] md:text-[15px]">
                Thời Lý – Trần là giai đoạn phát triển rực rỡ của Đại Việt, đánh dấu sự hưng thịnh về chính trị, kinh tế, văn hóa và quân sự. Đặc biệt, tinh thần dân tộc và bản lĩnh chống ngoại xâm được khẳng định mạnh mẽ qua hai cuộc kháng chiến chống quân Tống.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="#dong-thoi-gian"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#6e181b] bg-[#6e181b] px-4 py-3 text-xs font-medium text-white transition hover:bg-[#501013]"
                >
                  <span>Bắt đầu khám phá</span>
                  <ArrowIcon />
                </Link>
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-md border border-[#6e181b] bg-transparent px-4 py-3 text-xs font-medium text-[#6e181b] transition hover:bg-[#f2e9d8]">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#6e181b] text-[10px] text-white">▶</span>
                  <span>Xem video giới thiệu</span>
                </button>
              </div>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Nội dung triều đại">
            {['Tổng quan', 'Dòng thời gian', 'Sự kiện tiêu biểu', 'Văn hóa – Đời sống'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={tab === 'Dòng thời gian'}
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-medium transition ${
                  tab === 'Dòng thời gian'
                    ? 'border-[#6e181b] bg-[#6e181b] text-white'
                    : 'border-[#d7c5a1] bg-[#f8f3e8] text-[#302622] hover:bg-[#f2e9d8]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <section id="dong-thoi-gian" className="mt-8 border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3 text-[#6e181b]">
              <span className="inline-block h-3 w-3 rotate-45 bg-[#6e181b]" aria-hidden="true" />
              <h2 className="font-[Lora] text-2xl font-semibold md:text-3xl">Dòng thời gian sự kiện tiêu biểu</h2>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {timelineEvents.map((event) => (
                <Link
                  key={event.year}
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
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section id="thong-tin" className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Những thông tin chính</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {infoCards.map((item) => (
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

              <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Tài liệu tham khảo</h2>
                <div className="mt-5 space-y-3 text-sm text-[#302622]">
                  <a href="https://vi.wikipedia.org/wiki/%C4%90%E1%BA%A1i_Vi%E1%BB%87t" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-3 py-3 hover:bg-[#f2e9d8]">
                    <span className="text-[#6e181b]">▮</span>
                    <span>Đại Việt sử ký toàn thư</span>
                  </a>
                  <a href="https://vi.wikipedia.org/wiki/Vi%E1%BB%87t_Nam_s%E1%BB%AD_l%C6%B0%E1%BB%A3c" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-3 py-3 hover:bg-[#f2e9d8]">
                    <span className="text-[#6e181b]">▮</span>
                    <span>Việt Nam sử lược</span>
                  </a>
                  <a href="https://baotanglichsu.vn/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-3 py-3 hover:bg-[#f2e9d8]">
                    <span className="text-[#6e181b]">♟</span>
                    <span>Các nghiên cứu hiện đại</span>
                  </a>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section id="nhan-vat" className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Nhân vật tiêu biểu</h2>
                  <Link href="#nhan-vat" aria-label="Xem tất cả nhân vật" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7c5a1] text-[#6e181b] hover:bg-[#f2e9d8]">
                    <ArrowIcon />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  {people.map((person) => (
                    <Link key={person.name} href="/" className="group rounded-lg border border-[#d7c5a1] bg-white/70 p-2 transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="overflow-hidden rounded-md border border-[#d7c5a1]">
                        <img src={person.image} alt={person.name} className="h-28 w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div className="mt-3 font-[Lora] text-lg font-semibold text-[#6e181b]">{person.name}</div>
                      <div className="text-sm text-[#302622]">({person.years})</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.08em] text-[#776b61]">{person.dynasty}</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Các chương liên quan</h2>
                <div className="mt-5 grid gap-4">
                  {[
                    { title: "Nhà Lý", period: "(1009 – 1225)", image: "https://images.unsplash.com/photo-1553851919-596510268b99?auto=format&fit=crop&w=700&q=82" },
                    { title: "Nhà Trần", period: "(1225 – 1400)", image: "https://images.unsplash.com/photo-1784106237009-856d26d83f0c?auto=format&fit=crop&w=700&q=82" },
                  ].map((chapter) => (
                    <Link key={chapter.title} href="/" className="group flex items-center gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 p-2 transition hover:-translate-y-0.5 hover:shadow-md">
                      <img src={chapter.image} alt={chapter.title} className="h-16 w-16 rounded-md object-cover" />
                      <div className="flex-1">
                        <div className="font-[Lora] text-lg font-semibold text-[#6e181b]">{chapter.title}</div>
                        <div className="text-sm text-[#302622]">{chapter.period}</div>
                      </div>
                      <ArrowIcon />
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
}
