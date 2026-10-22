import { HeritageExplorer } from "@/features/heritage/components/HeritageExplorer";
import { fetchEvents, fetchLocations, fetchPeriods } from "@/services/entities/landing.service";

/** Cùng trang Di tích, mở sẵn khung chi tiết của di tích theo slug (link chia sẻ / liên kết từ trang khác). */
export default async function SiteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [sites, events, periods] = await Promise.all([fetchLocations(), fetchEvents(), fetchPeriods()]);
  return <HeritageExplorer sites={sites} events={events} periods={periods} initialSlug={slug} />;
}
