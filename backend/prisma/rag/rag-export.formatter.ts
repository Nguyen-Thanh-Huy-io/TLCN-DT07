import { ArticleKind, ContentStatus, PostType } from '@prisma/client';
import {
  CategoryHierarchyNode,
  ExportableArticle,
  ExportableBlogPost,
  ExportableLesson,
  ExportableTimelineNode,
  RagDocumentKind,
  RagExportArtifact,
  TimelineNodeArticleRef,
} from './rag-export.types';
import {
  blocksToMarkdown,
  extractBlogMetaBlock,
  htmlToCleanMarkdown,
} from './rag-markdown.util';

const ARTICLE_KIND_LABELS: Record<ArticleKind, string> = {
  [ArticleKind.EVENT]: 'Sự kiện lịch sử',
  [ArticleKind.PERSON]: 'Nhân vật lịch sử',
  [ArticleKind.LOCATION]: 'Di tích / Địa danh',
  [ArticleKind.DYNASTY]: 'Triều đại / Nhà nước',
  [ArticleKind.OTHER]: 'Bài viết lịch sử',
};

const SITE_TYPE_LABELS: Record<string, string> = {
  ANCIENT_CAPITAL: 'Kinh đô / Cố đô',
  CITADEL: 'Thành lũy / Kinh thành',
  PALACE: 'Cung điện / Lăng tẩm',
  BATTLEFIELD: 'Chiến trường / Bến bãi',
  RESISTANCE_BASE: 'Căn cứ kháng chiến',
  TEMPLE: 'Đền, chùa, miếu, đình',
  ARCHAEOLOGICAL_SITE: 'Di chỉ khảo cổ',
  MONUMENT: 'Khu tưởng niệm / Tượng đài',
  OTHER: 'Di tích / Địa danh khác',
};

const PRESERVATION_LABELS: Record<string, string> = {
  INTACT: 'Còn nguyên vẹn',
  MUSEUM_MEMORIAL: 'Bảo tàng / Khu lưu niệm',
  ARCHAEOLOGICAL_RUIN: 'Phế tích / Khảo cổ',
  RESTORED: 'Đã trùng tu / Tôn tạo',
  ACTIVE_SITE: 'Đang sinh hoạt / Thờ tự',
};

const GCS_HISGO_PREFIX = 'hisgo/';
const SECTION_DIVIDER = '\n\n';
const YAML_BOUNDARY = '---';

/** Chuẩn hóa tên file an toàn cho hệ điều hành & GCS object key. */
export function sanitizeExportSlug(
  rawSlug: string,
  fallbackId: string,
): string {
  const ascii = rawSlug
    .trim()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const cleaned = ascii
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallbackId.slice(0, 12);
}

/** Kế thừa Category.kind theo cây chuyên mục cha -> con (giống quy tắc frontend HISGO). */
export function resolveCategoryKind(
  categoriesById: ReadonlyMap<string, CategoryHierarchyNode>,
  categoryId: string | null | undefined,
): ArticleKind {
  let cursor = categoryId ? categoriesById.get(categoryId) : undefined;
  const visited = new Set<string>();
  while (cursor && !visited.has(cursor.id)) {
    if (cursor.kind) return cursor.kind;
    visited.add(cursor.id);
    cursor = cursor.parentId ? categoriesById.get(cursor.parentId) : undefined;
  }
  return ArticleKind.OTHER;
}

export function resolveArticleRouteConfig(kind: ArticleKind): {
  docKind: RagDocumentKind;
  routeBase: string;
  filePrefix: string;
} {
  switch (kind) {
    case ArticleKind.EVENT:
      return {
        docKind: RagDocumentKind.EVENT,
        routeBase: '/su-kien',
        filePrefix: 'su-kien--',
      };
    case ArticleKind.PERSON:
      return {
        docKind: RagDocumentKind.PERSON,
        routeBase: '/nhan-vat',
        filePrefix: 'nhan-vat--',
      };
    case ArticleKind.LOCATION:
      return {
        docKind: RagDocumentKind.LOCATION,
        routeBase: '/di-tich',
        filePrefix: 'di-tich--',
      };
    case ArticleKind.DYNASTY:
    case ArticleKind.OTHER:
    default:
      return {
        docKind: RagDocumentKind.ARTICLE,
        routeBase: '/bai-viet',
        filePrefix: 'bai-viet--',
      };
  }
}

function asObject(val: unknown): Record<string, unknown> | null {
  return val && typeof val === 'object' && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : null;
}

function extractStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .filter((v): v is string => typeof v === 'string' && Boolean(v.trim()))
        .map((v) => v.trim()),
    ),
  );
}

function extractString(raw: unknown): string {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : '';
}

function yamlScalar(value: string): string {
  return JSON.stringify(value);
}

function buildFrontmatter(
  fields: Array<[string, string | string[] | undefined]>,
): string {
  const lines: string[] = [YAML_BOUNDARY];
  for (const [key, value] of fields) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${yamlScalar(item)}`);
      }
      continue;
    }
    if (!value) continue;
    lines.push(`${key}: ${yamlScalar(value)}`);
  }
  lines.push(YAML_BOUNDARY);
  return lines.join('\n');
}

function formatYearLabel(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : String(year);
}

export function formatArticlePeriod(article: {
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
}): string {
  if (article.dateText?.trim()) return article.dateText.trim();
  if (article.startYear !== null && article.endYear !== null) {
    return article.startYear === article.endYear
      ? formatYearLabel(article.startYear)
      : `${formatYearLabel(article.startYear)} – ${formatYearLabel(article.endYear)}`;
  }
  if (article.startYear !== null) return formatYearLabel(article.startYear);
  if (article.endYear !== null) return formatYearLabel(article.endYear);
  return '';
}

function formatPersonSection(rawPerson: unknown): string {
  const p = asObject(rawPerson);
  if (!p) return '';
  const lines: string[] = ['## Hồ sơ nhân vật'];

  const titles = extractStringList(p.titles);
  const roles = extractStringList(p.roles);
  const works = extractStringList(p.notableWorks);
  const anecdotes = extractStringList(p.anecdotes);
  const hometown = extractString(p.hometown);
  const background = extractString(p.backgroundAndYouth);
  const legacy = extractString(p.legacyAndHonors);
  const famousQuote = extractString(p.famousQuote);

  if (titles.length)
    lines.push(`- **Tước hiệu / Chức danh:** ${titles.join(', ')}`);
  if (roles.length) lines.push(`- **Vai trò:** ${roles.join(', ')}`);
  if (hometown) lines.push(`- **Quê quán:** ${hometown}`);
  if (background) lines.push(`- **Xuất thân & Thiếu thời:** ${background}`);
  if (works.length)
    lines.push(`- **Công trình / Tác phẩm tiêu biểu:** ${works.join('; ')}`);
  if (legacy) lines.push(`- **Di sản & Tôn vinh:** ${legacy}`);
  if (famousQuote) lines.push(`- **Câu nói nổi tiếng:** "${famousQuote}"`);
  if (anecdotes.length) {
    lines.push('- **Giai thoại lịch sử:**');
    anecdotes.forEach((a) => lines.push(`  - ${a}`));
  }

  const milestones = Array.isArray(p.milestones) ? p.milestones : [];
  const milestoneLines = formatPersonMilestones(milestones);
  if (milestoneLines.length > 0) {
    lines.push('- **Mốc đời đáng chú ý:**', ...milestoneLines);
  }

  return lines.length > 1 ? lines.join('\n') : '';
}

function formatPersonMilestones(milestones: unknown[]): string[] {
  const lines: string[] = [];
  for (const item of milestones) {
    const rec = asObject(item);
    if (!rec) continue;
    const title = extractString(rec.title);
    const year = typeof rec.year === 'number' ? rec.year : NaN;
    if (!title || !Number.isInteger(year)) continue;
    const month = typeof rec.month === 'number' ? `/${rec.month}` : '';
    const day = typeof rec.day === 'number' ? `/${rec.day}` : '';
    const datePrefix = `${formatYearLabel(year)}${month}${day}`;
    const note = extractString(rec.note);
    lines.push(`  - [${datePrefix}] ${title}${note ? `: ${note}` : ''}`);
  }
  return lines;
}

function formatSiteSection(rawSite: unknown): string {
  const s = asObject(rawSite);
  if (!s) return '';
  const lines: string[] = ['## Hồ sơ di tích / địa danh'];

  const address = extractString(s.address);
  const siteType = extractString(s.siteType);
  const recognizedYear = extractString(s.recognizedYear);
  const preservation = extractString(s.preservation);
  const statusNote = extractString(s.statusNote);
  const managingAgency = extractString(s.managingAgency);
  const arch = extractString(s.architecturalStyle);

  if (siteType)
    lines.push(`- **Loại di tích:** ${SITE_TYPE_LABELS[siteType] ?? siteType}`);
  if (address) lines.push(`- **Địa chỉ:** ${address}`);
  if (recognizedYear)
    lines.push(`- **Năm công nhận / xếp hạng:** ${recognizedYear}`);
  if (preservation) {
    lines.push(
      `- **Hiện trạng bảo tồn:** ${PRESERVATION_LABELS[preservation] ?? preservation}`,
    );
  }
  if (statusNote) lines.push(`- **Ghi chú hiện trạng:** ${statusNote}`);
  if (managingAgency) lines.push(`- **Đơn vị quản lý:** ${managingAgency}`);
  if (arch) lines.push(`- **Phong cách kiến trúc:** ${arch}`);

  return lines.length > 1 ? lines.join('\n') : '';
}

function formatArticleLinksSection(
  article: ExportableArticle,
  categoriesById: ReadonlyMap<string, CategoryHierarchyNode>,
  includeDrafts: boolean,
): string {
  const seen = new Set<string>();
  const bullets: string[] = [];
  const candidates = [
    ...article.linksOut.map((l) => ({ item: l.target, label: l.label })),
    ...article.linksIn.map((l) => ({ item: l.source, label: l.label })),
  ];

  for (const { item, label } of candidates) {
    if (!includeDrafts && item.status !== ContentStatus.PUBLISHED) continue;
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    const kind = resolveCategoryKind(categoriesById, item.categoryId);
    const { routeBase } = resolveArticleRouteConfig(kind);
    const labelPart = label ? ` (${label})` : '';
    bullets.push(`- [${item.title}](${routeBase}/${item.slug})${labelPart}`);
  }

  return bullets.length > 0
    ? `## Liên kết tri thức liên quan\n${bullets.join('\n')}`
    : '';
}

function buildInfoBullets(items: Array<[string, string]>): string {
  const lines = items
    .filter(([, val]) => Boolean(val))
    .map(([k, val]) => `- **${k}:** ${val}`);
  return lines.join('\n');
}

export function formatArticleMarkdown(
  article: ExportableArticle,
  categoriesById: ReadonlyMap<string, CategoryHierarchyNode>,
  includeDrafts = false,
): RagExportArtifact {
  const catNode = article.categoryId
    ? categoriesById.get(article.categoryId)
    : undefined;
  const categoryKind = resolveCategoryKind(categoriesById, article.categoryId);
  const { docKind, routeBase, filePrefix } =
    resolveArticleRouteConfig(categoryKind);
  const href = `${routeBase}/${article.slug}`;
  const relativePath = `articles/${filePrefix}${sanitizeExportSlug(article.slug, article.id)}.md`;

  const meta = asObject(article.metadata);
  const aliases = extractStringList(meta?.aliases);
  const sources = extractStringList(meta?.sources);
  const tags = article.articleTags.map((t) => t.tag.name).filter(Boolean);
  const period = formatArticlePeriod(article);
  const kindLabel = ARTICLE_KIND_LABELS[categoryKind];

  const frontmatter = buildFrontmatter([
    ['id', article.id],
    ['model', 'Article'],
    ['kind', docKind],
    ['categoryKind', categoryKind],
    ['categoryName', catNode?.name],
    ['topic', article.topic?.name],
    ['title', article.title],
    ['slug', article.slug],
    ['hisgoUrl', href],
    ['period', period || undefined],
    ['aliases', aliases],
    ['sources', sources],
    ['tags', tags],
  ]);

  const bodyMarkdown = blocksToMarkdown(article.contentBlocks);
  const sections = [
    frontmatter,
    `# ${article.title}`,
    buildInfoBullets([
      ['Phân loại', `${kindLabel}${catNode?.name ? ` (${catNode.name})` : ''}`],
      ['Đường dẫn trên HISGO', href],
      ['Niên đại / Thời kỳ', period],
      ['Chủ đề', article.topic?.name ?? ''],
      ['Tên gọi khác (Aliases)', aliases.join(', ')],
      ['Từ khóa (Tags)', tags.join(', ')],
    ]),
    article.summary?.trim() ? `## Tóm tắt\n${article.summary.trim()}` : '',
    formatPersonSection(meta?.person),
    formatSiteSection(meta?.site),
    bodyMarkdown ? `## Nội dung chi tiết\n${bodyMarkdown}` : '',
    formatArticleLinksSection(article, categoriesById, includeDrafts),
    sources.length > 0
      ? `## Nguồn tư liệu tham khảo\n${sources.map((s) => `- ${s}`).join('\n')}`
      : '',
  ].filter(Boolean);

  const subtitleParts = [kindLabel, period, article.topic?.name].filter(
    Boolean,
  );
  return {
    relativePath,
    markdown: `${sections.join(SECTION_DIVIDER)}\n`,
    manifestEntry: {
      relativePath,
      gcsDefaultPath: `${GCS_HISGO_PREFIX}${relativePath}`,
      kind: docKind,
      sourceModel: 'Article',
      sourceId: article.id,
      slug: article.slug,
      title: article.title,
      subtitle: subtitleParts.join(' · ') || 'Bài viết tri thức HISGO',
      href,
      sources,
      aliases,
    },
  };
}

export function formatLessonMarkdown(
  lesson: ExportableLesson,
): RagExportArtifact {
  const href = `/bai-hoc/${lesson.slug}`;
  const relativePath = `lessons/bai-hoc--${sanitizeExportSlug(lesson.slug, lesson.id)}.md`;
  const tags = lesson.lessonTags.map((t) => t.tag.name).filter(Boolean);
  const sources = lesson.sourceReferenceNote?.trim()
    ? [lesson.sourceReferenceNote.trim()]
    : [];

  const frontmatter = buildFrontmatter([
    ['id', lesson.id],
    ['model', 'Lesson'],
    ['kind', RagDocumentKind.LESSON],
    ['title', lesson.title],
    ['slug', lesson.slug],
    ['hisgoUrl', href],
    ['topic', lesson.topic?.name],
    ['difficulty', lesson.difficulty],
    ['sources', sources],
    ['tags', tags],
  ]);

  const blockBody = blocksToMarkdown(lesson.content);
  const richTextFallback = !blockBody
    ? htmlToCleanMarkdown(lesson.contentRichText)
    : '';
  const body = blockBody || richTextFallback;

  const sections = [
    frontmatter,
    `# Bài học: ${lesson.title}`,
    buildInfoBullets([
      ['Loại tài liệu', 'Bài học hệ thống HISGO'],
      ['Đường dẫn trên HISGO', href],
      ['Chủ đề', lesson.topic?.name ?? ''],
      ['Mức độ', lesson.difficulty],
      ['Từ khóa (Tags)', tags.join(', ')],
    ]),
    lesson.description?.trim()
      ? `## Mô tả bài học\n${lesson.description.trim()}`
      : '',
    body ? `## Nội dung bài học\n${body}` : '',
    sources.length > 0 ? `## Nguồn tham khảo\n- ${sources[0]}` : '',
  ].filter(Boolean);

  const subtitleParts = ['Bài học', lesson.topic?.name].filter(Boolean);
  return {
    relativePath,
    markdown: `${sections.join(SECTION_DIVIDER)}\n`,
    manifestEntry: {
      relativePath,
      gcsDefaultPath: `${GCS_HISGO_PREFIX}${relativePath}`,
      kind: RagDocumentKind.LESSON,
      sourceModel: 'Lesson',
      sourceId: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      subtitle: subtitleParts.join(' · '),
      href,
      sources,
      aliases: [],
    },
  };
}

function resolveAuthorName(author: ExportableBlogPost['author']): string {
  const full = [author.userProfile?.firstName, author.userProfile?.lastName]
    .filter((v): v is string => Boolean(v?.trim()))
    .join(' ')
    .trim();
  return full || author.username;
}

export function formatBlogPostMarkdown(
  post: ExportableBlogPost,
): RagExportArtifact {
  const href = `/blog/${post.slug}`;
  const relativePath = `blogs/blog--${sanitizeExportSlug(post.slug, post.id)}.md`;
  const authorName = resolveAuthorName(post.author);
  const postTypeLabel =
    post.postType === PostType.LONG_FORM
      ? 'Chuyên khảo (Long-form)'
      : 'Thảo luận / Chia sẻ';

  const meta = extractBlogMetaBlock(post.contentBlocks);
  const sources = meta.references.map((r) =>
    [r.title, r.source, r.url].filter(Boolean).join(' — '),
  );
  const publishedDate = post.publishedAt
    ? post.publishedAt.toISOString().slice(0, 10)
    : undefined;

  const frontmatter = buildFrontmatter([
    ['id', post.id],
    ['model', 'BlogPost'],
    ['kind', RagDocumentKind.BLOG],
    ['postType', post.postType],
    ['title', post.title],
    ['slug', post.slug],
    ['hisgoUrl', href],
    ['author', authorName],
    ['publishedAt', publishedDate],
    ['tags', meta.tags],
    ['sources', sources],
  ]);

  const body = blocksToMarkdown(post.contentBlocks);
  const referenceBullets = meta.references
    .map((r) => {
      const label = [r.title, r.source].filter(Boolean).join(' — ');
      return r.url ? `- [${label || r.url}](${r.url})` : `- ${label}`;
    })
    .filter(Boolean);

  const sections = [
    frontmatter,
    `# ${post.title}`,
    buildInfoBullets([
      ['Loại tài liệu', postTypeLabel],
      ['Đường dẫn trên HISGO', href],
      ['Tác giả', authorName],
      ['Ngày xuất bản', publishedDate ?? ''],
      ['Thẻ bài viết', meta.tags.join(', ')],
    ]),
    post.excerpt?.trim() ? `## Tóm tắt\n${post.excerpt.trim()}` : '',
    body ? `## Nội dung bài viết\n${body}` : '',
    referenceBullets.length > 0
      ? `## Tài liệu tham khảo\n${referenceBullets.join('\n')}`
      : '',
  ].filter(Boolean);

  return {
    relativePath,
    markdown: `${sections.join(SECTION_DIVIDER)}\n`,
    manifestEntry: {
      relativePath,
      gcsDefaultPath: `${GCS_HISGO_PREFIX}${relativePath}`,
      kind: RagDocumentKind.BLOG,
      sourceModel: 'BlogPost',
      sourceId: post.id,
      slug: post.slug,
      title: post.title,
      subtitle: `${postTypeLabel} · ${authorName}`,
      href,
      sources,
      aliases: [],
    },
  };
}

export function formatTimelineNodeDate(node: {
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
}): string {
  if (node.dateText?.trim()) return node.dateText.trim();
  if (node.year === null) return '';

  const startBase = formatYearLabel(node.year);
  const dmPrefix = [
    node.day !== null ? String(node.day) : '',
    node.month !== null ? String(node.month) : '',
  ]
    .filter(Boolean)
    .join('/');
  const startStr = dmPrefix ? `${dmPrefix}/${startBase}` : startBase;

  if (node.endYear !== null && node.endYear !== node.year) {
    return `${startStr} – ${formatYearLabel(node.endYear)}`;
  }
  return startStr;
}

function collectNodeArticles(
  node: ExportableTimelineNode,
  includeDrafts: boolean,
): TimelineNodeArticleRef[] {
  const map = new Map<string, TimelineNodeArticleRef>();
  const add = (art: TimelineNodeArticleRef | null) => {
    if (!art) return;
    if (!includeDrafts && art.status !== ContentStatus.PUBLISHED) return;
    if (!map.has(art.slug)) map.set(art.slug, art);
  };
  add(node.article);
  for (const link of node.articles) {
    add(link.article);
  }
  return Array.from(map.values());
}

export function formatTimelineNodeMarkdown(
  node: ExportableTimelineNode,
  categoriesById: ReadonlyMap<string, CategoryHierarchyNode>,
  includeDrafts = false,
): RagExportArtifact {
  const periodHref = `/giai-doan/${node.timeline.slug}`;
  const timelineSafeSlug = sanitizeExportSlug(
    node.timeline.slug,
    node.timeline.id,
  );
  const orderPad = String(Math.max(0, node.displayOrder)).padStart(3, '0');
  const shortId = node.id.slice(0, 8);
  const relativePath = `timelines/moc--${timelineSafeSlug}--${orderPad}-${shortId}.md`;

  const dateLabel = formatTimelineNodeDate(node);
  const linkedArticles = collectNodeArticles(node, includeDrafts);
  const linkedMarkdown = linkedArticles.map((art) => {
    const kind = resolveCategoryKind(categoriesById, art.categoryId);
    const { routeBase } = resolveArticleRouteConfig(kind);
    return `- [${art.title}](${routeBase}/${art.slug})`;
  });

  const primaryHref =
    linkedArticles.length > 0
      ? (() => {
          const kind = resolveCategoryKind(
            categoriesById,
            linkedArticles[0].categoryId,
          );
          return `${resolveArticleRouteConfig(kind).routeBase}/${linkedArticles[0].slug}`;
        })()
      : periodHref;

  const frontmatter = buildFrontmatter([
    ['id', node.id],
    ['model', 'TimelineNode'],
    ['kind', RagDocumentKind.TIMELINE_NODE],
    ['title', node.title],
    ['timelineTitle', node.timeline.title],
    ['timelineSlug', node.timeline.slug],
    ['topic', node.timeline.topic?.name],
    ['dateLabel', dateLabel || undefined],
    ['hisgoUrl', primaryHref],
    ['periodUrl', periodHref],
    ['timelineOverviewUrl', '/dong-thoi-gian'],
  ]);

  const sections = [
    frontmatter,
    `# Mốc lịch sử: ${node.title}`,
    buildInfoBullets([
      ['Thuộc dòng thời gian', node.timeline.title],
      ['Niên đại', dateLabel],
      ['Chủ đề', node.timeline.topic?.name ?? ''],
      ['Đường dẫn giai đoạn', periodHref],
      ['Dòng thời gian đa tầng', '/dong-thoi-gian'],
    ]),
    node.description?.trim()
      ? `## Mô tả mốc lịch sử\n${node.description.trim()}`
      : '',
    linkedMarkdown.length > 0
      ? `## Bài viết HISGO gắn với mốc này\n${linkedMarkdown.join('\n')}`
      : '',
  ].filter(Boolean);

  const subtitleParts = [
    dateLabel,
    `Dòng thời gian: ${node.timeline.title}`,
  ].filter(Boolean);

  return {
    relativePath,
    markdown: `${sections.join(SECTION_DIVIDER)}\n`,
    manifestEntry: {
      relativePath,
      gcsDefaultPath: `${GCS_HISGO_PREFIX}${relativePath}`,
      kind: RagDocumentKind.TIMELINE_NODE,
      sourceModel: 'TimelineNode',
      sourceId: node.id,
      slug: `${node.timeline.slug}#${node.displayOrder}`,
      title: dateLabel ? `${dateLabel}: ${node.title}` : node.title,
      subtitle: subtitleParts.join(' · '),
      href: primaryHref,
      sources: [],
      aliases: [],
    },
  };
}

/** Đảm bảo tên file xuất không trùng nhau nếu có slug sau chuẩn hóa bị trùng. */
export function ensureUniqueArtifactPath(
  artifact: RagExportArtifact,
  usedPaths: Set<string>,
): RagExportArtifact {
  if (!usedPaths.has(artifact.relativePath)) {
    usedPaths.add(artifact.relativePath);
    return artifact;
  }

  const extIndex = artifact.relativePath.lastIndexOf('.md');
  const suffix = `-${artifact.manifestEntry.sourceId.slice(0, 8)}`;
  const uniquePath =
    extIndex >= 0
      ? `${artifact.relativePath.slice(0, extIndex)}${suffix}.md`
      : `${artifact.relativePath}${suffix}`;

  usedPaths.add(uniquePath);
  return {
    ...artifact,
    relativePath: uniquePath,
    manifestEntry: {
      ...artifact.manifestEntry,
      relativePath: uniquePath,
      gcsDefaultPath: `${GCS_HISGO_PREFIX}${uniquePath}`,
    },
  };
}
