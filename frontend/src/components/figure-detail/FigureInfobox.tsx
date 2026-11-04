import Link from "next/link";
import { PUBLIC_ROUTE_PREFIX } from "@/services/entities/landing.service";
import { relationTargetLabel, type FigureView } from "@/components/figures/figure-utils";
import type { TaxonomyTermItem } from "@/services/entities/taxonomy.service";

/**
 * Hộp thông tin kiểu Wikipedia — các trường "Phối ngẫu/Thân phụ/Hậu duệ" không cần cột DB
 * riêng: chiếu thẳng từ figure.relationships (SPOUSE_OF/CHILD_OF/PARENT_OF), đúng tinh
 * thần mô hình Entity + Statement đã có.
 */
export function FigureInfobox({ figure, relationTerms }: { figure: FigureView; relationTerms: TaxonomyTermItem[] }) {
  const byLabel = new Map<string, { name: string; slug: string }[]>();
  for (const rel of figure.relationships) {
    if (!["SPOUSE_OF", "PARENT_OF", "CHILD_OF"].includes(rel.relationType)) continue;
    const label = relationTargetLabel(rel, relationTerms);
    const list = byLabel.get(label) || [];
    list.push({ name: rel.name, slug: rel.slug });
    byLabel.set(label, list);
  }

  const rows: Array<{ label: string; value: React.ReactNode }> = [];
  const birth = figure.birthDateLabel || (figure.birthYear != null ? String(figure.birthYear) : null);
  const death = figure.deathDateLabel || (figure.deathYear != null ? String(figure.deathYear) : null);
  if (birth) rows.push({ label: "Sinh", value: birth });
  if (death) rows.push({ label: "Mất", value: death });
  if (!birth && !death) rows.push({ label: "Niên đại", value: figure.lifespanLabel });
  if (figure.legacy.hometown) rows.push({ label: "Quê quán", value: figure.legacy.hometown });

  for (const [label, people] of byLabel) {
    rows.push({
      label,
      value: (
        <>
          {people.map((p, i) => (
            <span key={p.slug}>
              {i > 0 && ", "}
              <Link href={`${PUBLIC_ROUTE_PREFIX.FIGURE}/${p.slug}`}>{p.name}</Link>
            </span>
          ))}
        </>
      ),
    });
  }

  if (figure.aliases.length > 0) rows.push({ label: "Tên gọi khác", value: figure.aliases.join(" · ") });
  if (figure.occupation) rows.push({ label: "Vai trò", value: figure.occupation });
  if (figure.titles.length > 0) rows.push({ label: "Tước hiệu", value: figure.titles.join(" · ") });

  return (
    <div className="ce-context ce-sticky-card ce-infobox">
      <h3>{figure.name}</h3>
      {rows.length > 0 ? (
        <dl>
          {rows.map((r, i) => (
            <div key={i} className="ce-infobox-row">
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="ce-empty" style={{ padding: "12px 0" }}>
          Chưa có đủ dữ liệu để dựng hộp thông tin.
        </p>
      )}
    </div>
  );
}
