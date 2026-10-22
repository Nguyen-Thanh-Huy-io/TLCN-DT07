import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { SiteDetailView } from "@/features/sites/SiteDetailView";
import { fetchLocationBySlug } from "@/services/entities/landing.service";

export default async function SiteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await fetchLocationBySlug(slug);

  if (!site) {
    return (
      <div className="min-h-screen bg-[#f6f5f0]">
        <Header activeTab="di-tich" />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b0403a]">Di tích</p>
          <h1 className="mt-3 font-[family-name:var(--font-noto-serif)] text-3xl font-bold text-[#18231f]">
            Không tìm thấy di tích này
          </h1>
          <p className="mt-3 text-sm text-[#5f6a65]">Đường dẫn “{slug}” chưa có dữ liệu được xuất bản.</p>
          <Link
            href="/di-tich"
            className="mt-6 inline-flex rounded-lg bg-[#8d2f2c] px-5 py-3 text-sm font-bold text-white hover:bg-[#b0403a]"
          >
            Xem tất cả di tích
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return <SiteDetailView site={site} />;
}
