import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { SitesDirectory } from "@/features/sites/SitesDirectory";
import { fetchEvents, fetchLocations, fetchPeriods } from "@/services/entities/landing.service";
import "@/components/timeline/sk-timeline.css";

export default async function DiTichPage() {
  const [sites, events, periods] = await Promise.all([fetchLocations(), fetchEvents(), fetchPeriods()]);
  return (
    <main>
      <Header activeTab="di-tich" />
      <SitesDirectory sites={sites} events={events} periods={periods} />
      <Footer />
    </main>
  );
}
