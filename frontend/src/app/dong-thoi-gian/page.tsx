import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { TimelineExplorer } from "@/components/timeline/TimelineExplorer";
import { buildEraDataset } from "@/components/timeline/sk-adapter";
import { fetchEvents, fetchPeriods } from "@/services/entities/landing.service";
import { fetchCategories, extractEventCategories } from "@/services/public/public-content.service";
import "@/components/timeline/sk-timeline.css";

export const dynamic = "force-dynamic";

export default async function DongThoiGianPage() {
  const [events, periods, categories] = await Promise.all([
    fetchEvents(),
    fetchPeriods(),
    fetchCategories(),
  ]);

  const eras = buildEraDataset(periods, events, extractEventCategories(categories));

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-body)]">
      <Header activeSectionId="timeline" />
      <TimelineExplorer eras={eras} categories={categories} />
      <Footer />
    </div>
  );
}
