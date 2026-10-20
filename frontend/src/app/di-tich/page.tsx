import Link from "next/link";
import { Header } from "@/components/hisgo/Header";

const landmarks = [
  {
    name: "Cổ Loa",
    province: "Đông Anh, Hà Nội",
    label: "Kinh đô",
    period: "Âu Lạc – Nhà Lý",
    event: "Xây dựng thành Cổ Loa, chiếc nỏ thần Kim Quy.",
    region: "Bắc Bộ",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Hoa Lư",
    province: "Ninh Bình",
    label: "Cố đô",
    period: "Đinh – Tiền Lê",
    event: "Kinh đô đầu tiên của nhà nước phong kiến trung ương.",
    region: "Bắc Bộ",
    image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Thăng Long",
    province: "Hà Nội",
    label: "Hoàng thành",
    period: "Lý – Trần – Lê",
    event: "Dời đô năm 1010, xây dựng cội nguồn ngàn năm văn hiến Đại Việt.",
    region: "Bắc Bộ",
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Bạch Đằng Giang",
    province: "Quảng Ninh – Hải Phòng",
    label: "Chiến trường",
    period: "Ngô Quyền – Trần",
    event: "Đại thắng quân Nam Hán năm 938, đánh tan giặc Nguyên Mông 1288.",
    region: "Đông Bắc Bộ",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Lam Kinh",
    province: "Thọ Xuân, Thanh Hóa",
    label: "Tây Kinh",
    period: "Thời Lê sơ",
    event: "Căn cứ khởi nghĩa Lam Sơn và lăng tẩm các vua Hậu Lê.",
    region: "Bắc Trung Bộ",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Huế",
    province: "Thừa Thiên Huế",
    label: "Đại Nội",
    period: "Triều Nguyễn",
    event: "Kinh đô phong kiến cuối cùng của Việt Nam (1802 – 1945).",
    region: "Miền Trung",
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
  },
];

const events = [
  "Trận Bạch Đằng năm 938",
  "Chiến thắng Ngọc Hối – Đống Đa",
  "Khởi nghĩa Lam Sơn",
  "Chiến dịch Điện Biên Phủ 1954",
];

export default function DiTichPage() {
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

            <section className="mx-auto mt-8 w-full max-w-5xl rounded-[18px] border border-[#dcc39c] bg-[#f7f1e5] p-4 shadow-sm md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative block flex-1">
                  <span className="sr-only">Tìm kiếm di tích</span>
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6a5f53]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4.2 4.2" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cổ Loa, Thăng Long, Hoa Lư..."
                    className="h-[50px] w-full rounded-lg border border-[#dcc39c] bg-[#fffdf9] pl-11 pr-4 text-base text-[#231b15] outline-none placeholder:text-[#6a5f53] focus:ring-2 focus:ring-[#c5a059]/30"
                  />
                </label>
                <button
                  type="button"
                  className="h-[50px] rounded-lg bg-[#681717] px-7 text-base font-medium text-[#fffbeb] transition hover:bg-[#7c1e1e]"
                >
                  Tìm kiếm
                </button>
              </div>

              <div className="mt-4 grid gap-3 border-t border-[#e7d7b7] pt-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Khu vực", value: "Tất cả khu vực" },
                  { label: "Thời kỳ", value: "Tất cả thời kỳ" },
                  { label: "Loại di tích", value: "Tất cả" },
                ].map((item) => (
                  <label key={item.label} className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6a5f53]">{item.label}</span>
                    <select
                      defaultValue=""
                      className="h-[42px] rounded-lg border border-[#dcc39c] bg-[#fffdf9] px-3 text-sm text-[#231b15] outline-none focus:ring-2 focus:ring-[#c5a059]/30"
                    >
                      <option value="">{item.value}</option>
                      <option value="north">Bắc Bộ</option>
                      <option value="central">Miền Trung</option>
                    </select>
                  </label>
                ))}

                <button
                  type="button"
                  className="mt-auto flex h-[42px] items-center justify-center gap-2 rounded-lg border border-[#dcc39c] bg-[#efe7d6] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a5f53]"
                >
                  Thiết lập lại
                </button>
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-5 flex flex-col gap-3 border-b border-[#dcc39c] pb-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-[family-name:var(--font-heading)] flex items-center gap-3 text-2xl font-bold text-[#231b15] md:text-3xl">
                  <span className="h-6 w-2.5 rounded-sm bg-[#681717]" aria-hidden="true" />
                  Di tích tiêu biểu
                </h2>
                <span className="w-fit rounded-full border border-[#dcc39c] bg-[#fef3c7]/80 px-3 py-1 text-sm font-medium text-[#6a5f53]">
                  Hiển thị 6 địa danh nổi bật
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {landmarks.map((landmark) => (
                  <article key={landmark.name} className="flex min-h-[220px] flex-col justify-between rounded-[18px] border border-[#e3d3b3] bg-[#fcfaf5] p-4 shadow-[0_4px_18px_rgba(88,68,40,0.04)]">
                    <div className="flex gap-4">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[#e6d3b1] bg-[#fef3c7]">
                        <img src={landmark.image} alt={landmark.name} className="h-full w-full object-cover" />
                        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-[#fef3c7]">{landmark.label}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-[family-name:var(--font-heading)] text-[1.5rem] leading-6 text-[#231b15]">{landmark.name}</h3>
                        <p className="mt-1 text-xs font-medium text-[#6a5f53]">({landmark.province})</p>
                        <div className="mt-2 flex items-center gap-2 text-[11px]">
                          <span className="font-semibold text-[#6a5f53]">Thời kỳ:</span>
                          <span className="rounded border border-[#e7d7b7] bg-[#f1e7d4] px-2 py-0.5 text-[10px] font-medium text-[#681717]">{landmark.period}</span>
                        </div>
                        <div className="mt-2 text-[12px] leading-5 text-[#231b15]">
                          <span className="font-semibold text-[#6a5f53]">Sự kiện: </span>
                          {landmark.event}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#e6d3b1] pt-3 text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-[#8a6828]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path d="M12 21s-6.7-4.35-9.5-8.35C.8 10.2 2 6 6.5 6c2.4 0 3.9 1.2 5.5 3 1.6-1.8 3.1-3 5.5-3 4.5 0 5.7 4.2 4 6.65C18.7 16.65 12 21 12 21Z"/>
                        </svg>
                        {landmark.region}
                      </span>
                      <Link href="/di-tich" className="font-semibold text-[#681717] transition hover:text-[#8a6828]">
                        Chi tiết →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
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

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {events.map((event) => (
                  <Link key={event} href="/di-tich" className="flex items-center gap-3 rounded-lg border border-[#dcc39c] bg-[#faf7f2] px-4 py-3 text-sm font-medium text-[#231b15] transition hover:bg-[#fffdf9]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6817171a] text-[#681717]">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M12 2v20M2 12h20" />
                      </svg>
                    </span>
                    {event}
                  </Link>
                ))}
              </div>
            </section>

            <footer className="mt-8 border-t border-[#dcc39c] pt-5 text-center text-xs tracking-[0.2em] text-[#6a5f53]">
              © 2026 HISGO — Hệ tri thức số hóa và khám phá không gian lịch sử Việt Nam
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
