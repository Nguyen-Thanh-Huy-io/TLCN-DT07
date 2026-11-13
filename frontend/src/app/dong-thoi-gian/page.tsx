import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { TimelineHero } from "@/components/timeline/TimelineChrome";
import { TimelineExplorer } from "@/components/timeline/TimelineExplorer";
import { buildEraDataset } from "@/components/timeline/sk-adapter";
import { fetchEvents, fetchPeriods } from "@/services/entities/landing.service";
import { fetchCategories } from "@/services/public/public-content.service";
import { extractEventCategories } from "@/services/public/article-kind";
import "@/components/timeline/sk-timeline.css";

export default async function DongThoiGianPage() {
  const [events, periods, categories] = await Promise.all([
    fetchEvents(),
    fetchPeriods(),
    fetchCategories(),
  ]);

  const eras = buildEraDataset(periods, events, extractEventCategories(categories));
  const eventCount = eras.flatMap((e) => e.subEras.flatMap((s) => s.timeNodes.flatMap((n) => n.events))).length;

  return (
    <main>
      <Header activeSectionId="timeline" />
      <TimelineExplorer eras={eras} hero={<TimelineHero periodCount={eras.length} eventCount={eventCount} />} />
      <Footer />
    </main>
  );
}
