import { HeritageExplorer } from "@/features/heritage/components/HeritageExplorer";
import { fetchEvents, fetchLocations, fetchPeriods } from "@/services/entities/landing.service";

export default async function DiTichPage() {
  const [sites, events, periods] = await Promise.all([fetchLocations(), fetchEvents(), fetchPeriods()]);
  return <HeritageExplorer sites={sites} events={events} periods={periods} />;
}
