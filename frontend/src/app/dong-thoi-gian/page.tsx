import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { TimelineHero } from "@/components/timeline/TimelineHero";
import { TimelineExplorer } from "@/components/timeline/TimelineExplorer";
import { buildEraDataset } from "@/components/timeline/sk-adapter";
import { mockTimelineData } from "@/components/timeline/sk-mock-data";
import { fetchEvents, fetchPeriods } from "@/services/entities/landing.service";
import "@/components/timeline/sk-timeline.css";

export default async function DongThoiGianPage() {
  const [events, periods] = await Promise.all([fetchEvents(), fetchPeriods()]);

  const realEras = buildEraDataset(periods, events);
  const eras = realEras.length > 0 ? realEras : mockTimelineData;
  const eventCount = eras.flatMap((e) => e.subEras.flatMap((s) => s.timeNodes.flatMap((n) => n.events))).length;

  return (
    <main>
      <Header activeSectionId="timeline" />
      <TimelineExplorer eras={eras} hero={<TimelineHero periodCount={eras.length} eventCount={eventCount} />} />
      <Footer />
    </main>
  );
}
