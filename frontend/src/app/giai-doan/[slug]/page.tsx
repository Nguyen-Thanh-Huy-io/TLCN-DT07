import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { fetchPeriodBySlug, fetchPeriods } from "@/services/entities/landing.service";
import { PeriodDetailView } from "@/features/period-detail/components/PeriodDetailView";
import { siblingPeriods } from "@/features/period-detail/period-detail.adapter";

export default async function PeriodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [period, periods] = await Promise.all([fetchPeriodBySlug(slug), fetchPeriods()]);

  if (!period) {
    return (
      <div className="min-h-screen bg-[#f6f5f0]">
        <Header activeTab="timeline" />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b0403a]">Thời kỳ lịch sử</p>
          <h1 className="mt-3 font-[family-name:var(--font-noto-serif)] text-3xl font-bold text-[#18231f]">
            Không tìm thấy thời kỳ này
          </h1>
          <p className="mt-3 text-sm text-[#5f6a65]">Đường dẫn “{slug}” chưa có dữ liệu được xuất bản.</p>
          <Link
            href="/dong-thoi-gian"
            className="mt-6 inline-flex rounded-lg bg-[#8d2f2c] px-5 py-3 text-sm font-bold text-white hover:bg-[#b0403a]"
          >
            Mở Dòng thời gian
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return <PeriodDetailView period={period} siblings={siblingPeriods(period, periods)} />;
}
