import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { FiguresDirectory } from "@/components/figures/FiguresDirectory";
import { fetchFigureDirectory, fetchPeriods } from "@/services/entities/landing.service";
import { fetchTopics } from "@/services/public/public-content.service";
import "@/components/timeline/sk-timeline.css";
import "@/components/figures/sk-figures.css";

export default async function NhanVatPage({ searchParams }: { searchParams: Promise<{ nv?: string }> }) {
  const [{ nv }, figures, periods, topics] = await Promise.all([
    searchParams,
    fetchFigureDirectory(),
    fetchPeriods(),
    fetchTopics(),
  ]);

  return (
    <main>
      <Header activeTab="nhan-vat" />
      <FiguresDirectory figures={figures} periods={periods} topics={topics} initialSlug={nv} />
      <Footer />
    </main>
  );
}
