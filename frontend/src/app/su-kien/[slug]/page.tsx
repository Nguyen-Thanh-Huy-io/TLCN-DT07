import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { fetchEventBySlug, fetchEvents, fetchTaxonomyTerms } from "@/services/entities/landing.service";
import { buildEventReaderModel } from "@/components/event-detail/ce-adapter";
import { EventHero, EventQuickNav } from "@/components/event-detail/EventHero";
import { EventReader } from "@/components/event-detail/EventReader";
import "@/components/event-detail/ce-event.css";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, allEvents, categories, roles] = await Promise.all([
    fetchEventBySlug(slug),
    fetchEvents(),
    fetchTaxonomyTerms("EVENT_CATEGORY"),
    fetchTaxonomyTerms("EVENT_ROLE"),
  ]);

  if (!event) {
    return (
      <div className="ce-app">
        <Header activeSectionId="timeline" />
        <main className="ce-not-found">
          <small>SỰ KIỆN LỊCH SỬ</small>
          <h1>Không tìm thấy sự kiện lịch sử</h1>
          <p>Đường dẫn &ldquo;{slug}&rdquo; chưa có dữ liệu xuất bản.</p>
          <Link href="/dong-thoi-gian" className="ce-button">
            ← Quay về Dòng thời gian
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const model = buildEventReaderModel(event, allEvents, { categories, roles });

  return (
    <div className="ce-app">
      <Header activeSectionId="timeline" />
      <main>
        <EventHero model={model} />
        <EventReader model={model} />
        <EventQuickNav model={model} />
      </main>
      <Footer />
    </div>
  );
}
