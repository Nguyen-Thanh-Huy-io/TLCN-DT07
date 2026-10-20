import Link from "next/link";
import { Header } from "@/components/hisgo/Header";

const eraCatalog: Record<
  string,
  {
    title: string;
    years: string;
    description: string;
    image: string;
    breadcrumb: string[];
    info: Array<{ label: string; value: string; icon: "time" | "capital" | "dynasty" | "star" }>;
    timeline: Array<{ year: string; label: string; image: string }>;
    people: Array<{ name: string; years: string; dynasty: string; image: string }>;
    chapters: Array<{ title: string; period: string; image: string }>;
  }
> = {
  "nha-ly-nha-tran": {
    title: "Thời Lý – Trần",
    years: "(1009 – 1400)",
    description:
      "Thời Lý – Trần là giai đoạn phát triển rực rỡ của Đại Việt, đánh dấu sự hưng thịnh về chính trị, kinh tế, văn hóa và quân sự. Đặc biệt, tinh thần dân tộc và bản lĩnh chống ngoại xâm được khẳng định mạnh mẽ qua hai cuộc kháng chiến chống quân Tống.",
    image:
      "https://images.unsplash.com/photo-1786890427451-06d2701109db?auto=format&fit=crop&w=1600&q=88",
    breadcrumb: ["Trang chủ", "Các triều đại", "Thời Lý – Trần"],
    info: [
      { label: "Thời gian", value: "1009 – 1400", icon: "time" },
      { label: "Kinh đô", value: "Thăng Long", icon: "capital" },
      { label: "Triều đại", value: "Lý, Trần", icon: "dynasty" },
      { label: "Đặc điểm nổi bật", value: "Phát triển văn hóa, nghệ thuật, chống ngoại xâm", icon: "star" },
    ],
    timeline: [
      { year: "1009", label: "Lý Công Uẩn lên ngôi", image: "https://images.unsplash.com/photo-1553851919-596510268b99?auto=format&fit=crop&w=700&q=82" },
      { year: "1010", label: "Dời đô ra Thăng Long", image: "https://images.unsplash.com/photo-1784106237009-856d26d83f0c?auto=format&fit=crop&w=700&q=82" },
      { year: "1075", label: "Chiến thắng Ung Châu", image: "https://images.unsplash.com/photo-1710611296324-e4e71240aaf2?auto=format&fit=crop&w=700&q=82" },
      { year: "1225", label: "Trần Thái Tông lên ngôi", image: "https://images.unsplash.com/photo-1618165220283-e85246c4171c?auto=format&fit=crop&w=700&q=82" },
      { year: "1285", label: "Kháng chiến chống Nguyên", image: "https://images.unsplash.com/photo-1687585102149-08a4bd425052?auto=format&fit=crop&w=700&q=82" },
      { year: "1400", label: "Kết thúc nhà Trần", image: "https://images.unsplash.com/photo-1787555545394-83c8908e1e43?auto=format&fit=crop&w=700&q=82" },
    ],
    people: [
      { name: "Lý Công Uẩn", years: "974 – 1028", dynasty: "Nhà Lý", image: "https://images.unsplash.com/photo-1553851919-596510268b99?auto=format&fit=crop&w=700&q=82" },
      { name: "Trần Hưng Đạo", years: "1228 – 1300", dynasty: "Nhà Trần", image: "https://images.unsplash.com/photo-1666358861307-b50b70050744?auto=format&fit=crop&w=700&q=82" },
      { name: "Lý Thường Kiệt", years: "1019 – 1105", dynasty: "Nhà Lý", image: "https://images.unsplash.com/photo-1787555545394-83c8908e1e43?auto=format&fit=crop&w=700&q=82" },
    ],
    chapters: [
      { title: "Nhà Lý", period: "(1009 – 1225)", image: "https://images.unsplash.com/photo-1553851919-596510268b99?auto=format&fit=crop&w=700&q=82" },
      { title: "Nhà Trần", period: "(1225 – 1400)", image: "https://images.unsplash.com/photo-1784106237009-856d26d83f0c?auto=format&fit=crop&w=700&q=82" },
    ],
  },
  "van-lang-au-lac": {
    title: "Văn Lang – Âu Lạc",
    years: "(thế kỷ VII TCN – thế kỷ II TCN)",
    description:
      "Đây là giai đoạn hình thành và định hình bản sắc quốc gia, khi các bộ tộc Việt Nam tập hợp thành các quốc gia đầu tiên với kinh đô, phong tục và tổ chức xã hội riêng.",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=88",
    breadcrumb: ["Trang chủ", "Các triều đại", "Văn Lang – Âu Lạc"],
    info: [
      { label: "Thời gian", value: "thế kỷ VII TCN – thế kỷ II TCN", icon: "time" },
      { label: "Kinh đô", value: "Văn Lang", icon: "capital" },
      { label: "Triều đại", value: "Hùng Vương", icon: "dynasty" },
      { label: "Đặc điểm nổi bật", value: "Dựng nước, nông nghiệp, lễ hội, cộng đồng bản địa", icon: "star" },
    ],
    timeline: [
      { year: "VII TCN", label: "Hình thành các bộ tộc Việt cổ", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=82" },
      { year: "II TCN", label: "Sự phát triển của Văn Lang", image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=700&q=82" },
      { year: "III TCN", label: "Mở rộng quyền lực của các vua Hùng", image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=700&q=82" },
    ],
    people: [
      { name: "Hùng Vương", years: "thế kỷ XXV – III TCN", dynasty: "Văn Lang", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=82" },
    ],
    chapters: [
      { title: "Văn Lang", period: "(thế kỷ VII – III TCN)", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=82" },
      { title: "Âu Lạc", period: "(thế kỷ III TCN – 179 TCN)", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=82" },
    ],
  },
  "thoi-bac-thuoc": {
    title: "Thời Bắc thuộc",
    years: "(179 TCN – 938)",
    description:
      "Giai đoạn kéo dài hàng nghìn năm bị phong kiến phương Bắc thống trị, nhưng đồng thời là thời kỳ Việt Nam không ngừng kháng cự, giữ bản sắc và dần hình thành ý chí độc lập.",
    image:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=88",
    breadcrumb: ["Trang chủ", "Các triều đại", "Thời Bắc thuộc"],
    info: [
      { label: "Thời gian", value: "179 TCN – 938", icon: "time" },
      { label: "Kinh đô", value: "Giao Chỉ, Long Biên", icon: "capital" },
      { label: "Triều đại", value: "Hán, Đường", icon: "dynasty" },
      { label: "Đặc điểm nổi bật", value: "Kháng cự, giữ bản sắc, hình thành tư tưởng yêu nước", icon: "star" },
    ],
    timeline: [
      { year: "179 TCN", label: "Sự mở đầu thời Bắc thuộc", image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=700&q=82" },
      { year: "40", label: "Khởi nghĩa hai Bà Trưng", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=700&q=82" },
      { year: "938", label: "Kết thúc thời Bắc thuộc", image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=700&q=82" },
    ],
    people: [
      { name: "Hai Bà Trưng", years: "? – 43", dynasty: "Mê Linh", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=700&q=82" },
      { name: "Bà Triệu", years: "45 – 48", dynasty: "Giao Chỉ", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=82" },
    ],
    chapters: [
      { title: "Khởi nghĩa Hai Bà Trưng", period: "(40 – 43)", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=700&q=82" },
      { title: "Khởi nghĩa Bà Triệu", period: "(248)", image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=700&q=82" },
    ],
  },
};

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

export default async function EraDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const era = eraCatalog[slug] ?? eraCatalog["nha-ly-nha-tran"];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-4 py-6 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[1400px] border border-[#d7c5a1] bg-[rgba(249,245,236,0.86)] shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
        <Header />

        <main className="p-3 md:p-6">
          <section className="relative mt-4 overflow-hidden border border-[#d7c5a1] bg-[#f8f3e8]">
            <img src={era.image} alt={era.title} className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-center opacity-90" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#faf7ef_0%,#faf7ef_37%,rgba(250,247,239,0.9)_49%,rgba(250,247,239,0.1)_76%)]" />

            <div className="relative z-10 w-full max-w-[54%] p-6 md:p-8 lg:p-10">
              <nav className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-[#83766d] md:text-xs" aria-label="Đường dẫn">
                {era.breadcrumb.map((item, index) => (
                  <div key={item} className="flex items-center gap-2">
                    {index > 0 && <span>›</span>}
                    {index === era.breadcrumb.length - 1 ? (
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
                {era.title}
              </h1>
              <p className="mt-2 font-[Lora] text-base font-semibold text-[#6e181b]">{era.years}</p>
              <p className="mt-5 max-w-[620px] text-sm leading-7 text-[#504640] md:text-[15px]">{era.description}</p>

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
            {[
              "Tổng quan",
              "Dòng thời gian",
              "Sự kiện tiêu biểu",
              "Văn hóa – Đời sống",
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={tab === "Dòng thời gian"}
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-medium transition ${
                  tab === "Dòng thời gian"
                    ? "border-[#6e181b] bg-[#6e181b] text-white"
                    : "border-[#d7c5a1] bg-[#f8f3e8] text-[#302622] hover:bg-[#f2e9d8]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <section id="dong-thoi-gian" className="mt-8 rounded-none border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3 text-[#6e181b]">
              <span className="inline-block h-3 w-3 rotate-45 bg-[#6e181b]" aria-hidden="true" />
              <h2 className="font-[Lora] text-2xl font-semibold md:text-3xl">Dòng thời gian sự kiện tiêu biểu</h2>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {era.timeline.map((event, index) => (
                <Link
                  key={`${event.year}-${index}`}
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
                  {era.info.map((item) => (
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
                  <a href="#nhan-vat" aria-label="Xem tất cả nhân vật" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7c5a1] text-[#6e181b] hover:bg-[#f2e9d8]">
                    <ArrowIcon />
                  </a>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  {era.people.map((person) => (
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
                  {era.chapters.map((chapter) => (
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
    </div>
  );
}
