import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import {
  fetchEventBySlug,
  PUBLIC_ROUTE_PREFIX,
  PublicEventRelationDto,
} from "@/services/entities/landing.service";
import { EVENT_RELATION_TYPE_LABELS, EventRelationType } from "@/constants/enums";

function relationLabel(relationType: string): string {
  return (
    EVENT_RELATION_TYPE_LABELS[relationType as EventRelationType] || relationType
  );
}

function NotFoundState({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-4 py-6 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[1400px] border border-[#d7c5a1] bg-[rgba(249,245,236,0.86)] shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
        <Header activeSectionId="timeline" />
        <main className="p-6 md:p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A1E1E]">Sự kiện lịch sử</p>
          <h1 className="mt-3 font-[Lora] text-3xl font-semibold text-[#501013]">Không tìm thấy sự kiện lịch sử</h1>
          <p className="mt-3 text-sm text-[#504640]">
            Đường dẫn "{slug}" chưa có dữ liệu xuất bản trong cơ sở dữ liệu.
          </p>
          <Link
            href="/dong-thoi-gian"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md border border-[#6e181b] bg-[#6e181b] px-4 py-3 text-xs font-medium text-white transition hover:bg-[#501013]"
          >
            ← Quay về Dòng thời gian
          </Link>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function RelationGroup({
  title,
  relations,
  direction,
}: {
  title: string;
  relations: PublicEventRelationDto[];
  direction: "outgoing" | "incoming";
}) {
  if (relations.length === 0) return null;
  return (
    <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
      <h2 className="font-[Lora] text-xl font-semibold text-[#6e181b]">{title}</h2>
      <div className="mt-4 space-y-2.5">
        {relations.map((rel, idx) => (
          <Link
            key={`${rel.event.id}-${idx}`}
            href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${rel.event.slug}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-3.5 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8a6828]">
                {direction === "outgoing" ? relationLabel(rel.relationType) : `→ ${relationLabel(rel.relationType)}`}
              </span>
              <div className="mt-0.5 truncate font-medium text-[#302622]">{rel.event.title}</div>
            </div>
            <span className="shrink-0 text-xs text-[#776b61]">{rel.event.startYear}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);

  if (!event) {
    return <NotFoundState slug={slug} />;
  }

  const breadcrumb: Array<{ label: string; href?: string }> = [
    { label: "Trang chủ", href: "/" },
    { label: "Dòng thời gian", href: "/dong-thoi-gian" },
  ];
  if (event.period) {
    breadcrumb.push({
      label: event.period.name,
      href: `${PUBLIC_ROUTE_PREFIX.PERIOD}/${event.period.slug}`,
    });
  }
  breadcrumb.push({ label: event.title });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-4 py-6 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[1400px] border border-[#d7c5a1] bg-[rgba(249,245,236,0.86)] shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
        <Header activeSectionId="timeline" />

        <main className="p-3 md:p-6">
          <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-6 md:p-8 lg:p-10">
            <nav className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-[#83766d] md:text-xs" aria-label="Đường dẫn">
              {breadcrumb.map((item, index) => (
                <div key={item.label} className="flex items-center gap-2">
                  {index > 0 && <span>›</span>}
                  {item.href ? (
                    <Link href={item.href} className="hover:text-[#6e181b]">
                      {item.label}
                    </Link>
                  ) : (
                    <strong className="font-medium text-[#6e181b]">{item.label}</strong>
                  )}
                </div>
              ))}
            </nav>

            {event.parent && (
              <Link
                href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${event.parent.slug}`}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#8a6828] hover:underline"
              >
                ⤴ Thuộc chiến dịch/sự kiện lớn hơn: {event.parent.title}
              </Link>
            )}

            <h1 className="m-0 font-[Lora] text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-1.5px] text-[#501013]">
              {event.title}
            </h1>
            <p className="mt-2 font-[Lora] text-base font-semibold text-[#6e181b]">
              {event.eventDateNote || `Năm ${event.startYear}`}
            </p>
            {event.location && (
              <p className="mt-1 text-sm text-[#776b61]">📍 {event.location}</p>
            )}
            {event.description && (
              <p className="mt-5 max-w-[720px] text-sm leading-7 text-[#504640] md:text-[15px]">
                {event.description}
              </p>
            )}
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                <h2 className="font-[Lora] text-2xl font-semibold text-[#6e181b]">Các sự kiện con</h2>
                {event.children.length === 0 ? (
                  <p className="mt-3 text-sm text-[#776b61]">Sự kiện này không có sự kiện con nào.</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {event.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${child.slug}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#d7c5a1] bg-white/70 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div>
                          <div className="font-[Lora] text-lg font-semibold text-[#6e181b]">{child.title}</div>
                          {child.eventDateNote && (
                            <div className="text-sm text-[#302622]">{child.eventDateNote}</div>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-[#776b61]">{child.startYear}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-8">
              <RelationGroup
                title="Sự kiện liên quan (sự kiện này tác động tới)"
                relations={event.outgoingRelations}
                direction="outgoing"
              />
              <RelationGroup
                title="Sự kiện liên quan (tác động tới sự kiện này)"
                relations={event.incomingRelations}
                direction="incoming"
              />
              {event.outgoingRelations.length === 0 && event.incomingRelations.length === 0 && (
                <section className="border border-[#d7c5a1] bg-[#f8f3e8] p-5 md:p-7">
                  <h2 className="font-[Lora] text-xl font-semibold text-[#6e181b]">Sự kiện liên quan</h2>
                  <p className="mt-3 text-sm text-[#776b61]">Chưa có sự kiện liên quan nào được ghi nhận.</p>
                </section>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
