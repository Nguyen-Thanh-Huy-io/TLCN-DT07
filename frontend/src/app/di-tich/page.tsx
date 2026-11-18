import { HeritageExplorer } from "@/features/heritage/components/HeritageExplorer";
import { fetchEventArticles, fetchLocations, fetchPeriods } from "@/services/entities/landing.service";

export default async function DiTichPage() {
  const [sites, events, periods] = await Promise.all([fetchLocations(), fetchEventArticles(), fetchPeriods()]);
  return <HeritageExplorer sites={sites} events={events} periods={periods} />;
}
