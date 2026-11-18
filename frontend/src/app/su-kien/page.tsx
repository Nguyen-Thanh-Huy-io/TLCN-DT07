import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { EventsLibrary } from "@/features/events-library/EventsLibrary";
import { fetchEventArticles, fetchPeriods } from "@/services/entities/landing.service";
import { fetchTopics } from "@/services/public/public-content.service";
import "@/components/timeline/sk-timeline.css";

export default async function EventsLibraryPage() {
  const [events, periods, topics] = await Promise.all([fetchEventArticles(), fetchPeriods(), fetchTopics()]);
  return (
    <main>
      <Header activeTab="su-kien" />
      <EventsLibrary events={events} periods={periods} topics={topics} />
      <Footer />
    </main>
  );
}
