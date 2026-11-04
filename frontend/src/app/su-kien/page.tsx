import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { EventsLibrary } from "@/features/events-library/EventsLibrary";
import { fetchEvents, fetchPeriods } from "@/services/entities/landing.service";
import "@/components/timeline/sk-timeline.css";

export default async function EventsLibraryPage() {
  const [events, periods] = await Promise.all([fetchEvents(), fetchPeriods()]);
  return (
    <main>
      <Header activeTab="su-kien" />
      <EventsLibrary events={events} periods={periods} />
      <Footer />
    </main>
  );
}
