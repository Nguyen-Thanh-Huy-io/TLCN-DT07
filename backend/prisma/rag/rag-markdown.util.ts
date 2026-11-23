const PARAGRAPH_BREAK = '\n\n';
const BULLET_PREFIX = '- ';

const HTML_ENTITIES: ReadonlyArray<readonly [RegExp, string]> = [
  [/&nbsp;/gi, ' '],
  [/&amp;/gi, '&'],
  [/&lt;/gi, '<'],
  [/&gt;/gi, '>'],
  [/&quot;/gi, '"'],
  [/&#39;|&apos;/gi, "'"],
  [/&ndash;/gi, '–'],
  [/&mdash;/gi, '—'],
  [/&ldquo;|&rdquo;/gi, '"'],
  [/&lsquo;|&rsquo;/gi, "'"],
];

function decodeHtmlEntities(input: string): string {
  let result = input;
  for (const [pattern, replacement] of HTML_ENTITIES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function stripTagsClean(raw: string): string {
  return decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Chuyển đoạn HTML trong Block Builder / Rich Text sang Markdown sạch để RAG chunking chính xác. */
export function htmlToCleanMarkdown(rawHtml: unknown): string {
  if (typeof rawHtml !== 'string' || !rawHtml.trim()) return '';

  let md = rawHtml
    .replace(/\r\n/g, '\n')
    .replace(
      /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
      (_, t: string) => `\n## ${stripTagsClean(t)}\n`,
    )
    .replace(
      /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
      (_, t: string) => `\n## ${stripTagsClean(t)}\n`,
    )
    .replace(
      /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
      (_, t: string) => `\n### ${stripTagsClean(t)}\n`,
    )
    .replace(
      /<h4[^>]*>([\s\S]*?)<\/h4>/gi,
      (_, t: string) => `\n#### ${stripTagsClean(t)}\n`,
    )
    .replace(
      /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_, href: string, text: string) => {
        const cleanLabel = stripTagsClean(text);
        return cleanLabel ? `[${cleanLabel}](${href.trim()})` : '';
      },
    )
    .replace(
      /<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi,
      (_, t: string) => `**${stripTagsClean(t)}**`,
    )
    .replace(
      /<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi,
      (_, t: string) => `*${stripTagsClean(t)}*`,
    )
    .replace(
      /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
      (_, t: string) => `\n> ${stripTagsClean(t)}\n`,
    )
    .replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      (_, t: string) => `\n${BULLET_PREFIX}${stripTagsClean(t)}`,
    )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|ul|ol|section|article|tr)>/gi, PARAGRAPH_BREAK)
    .replace(/<\/(?:td|th)>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ');

  md = decodeHtmlEntities(md);
  const lines = md
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, PARAGRAPH_BREAK)
    .trim();

  return lines;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function clampHeadingLevel(rawLevel: unknown): number {
  const num = typeof rawLevel === 'number' ? rawLevel : 2;
  if (num <= 1) return 2;
  if (num >= 4) return 4;
  return Math.round(num);
}

function formatHeadingBlock(block: Record<string, unknown>): string {
  const level = clampHeadingLevel(block.level);
  const headingText =
    nonEmptyString(block.text) ||
    stripTagsClean(nonEmptyString(block.content)) ||
    nonEmptyString(block.heading);
  return headingText ? `${'#'.repeat(level)} ${headingText}` : '';
}

function formatQuoteBlock(block: Record<string, unknown>): string {
  const quoteBody = stripTagsClean(
    nonEmptyString(block.quoteText) || nonEmptyString(block.text),
  );
  if (!quoteBody) return '';
  const author = nonEmptyString(block.author);
  const ctx = nonEmptyString(block.sourceContext);
  const attribution = [author, ctx ? `(${ctx})` : ''].filter(Boolean).join(' ');
  return attribution
    ? `> "${quoteBody}"\n>\n> — ${attribution}`
    : `> "${quoteBody}"`;
}

function formatCalloutBlock(block: Record<string, unknown>): string {
  const title = nonEmptyString(block.title);
  const body = htmlToCleanMarkdown(block.content);
  if (!title && !body) return '';
  if (title && body) return `### ${title}${PARAGRAPH_BREAK}${body}`;
  return title ? `### ${title}` : body;
}

function formatCharacterOrEventBlock(
  block: Record<string, unknown>,
  label: string,
): string {
  const name = nonEmptyString(block.name) || nonEmptyString(block.title);
  if (!name) return '';
  const period =
    nonEmptyString(block.years) || nonEmptyString(block.timeLocation);
  const role = nonEmptyString(block.role);
  const summary = htmlToCleanMarkdown(block.summary);
  const detail = htmlToCleanMarkdown(block.detailContent);

  const headerParts = [`**${label}: ${name}**`];
  if (period) headerParts.push(`(${period})`);
  if (role) headerParts.push(`— ${role}`);

  return [headerParts.join(' '), summary, detail]
    .filter(Boolean)
    .join(PARAGRAPH_BREAK);
}

function formatTimelineBlock(block: Record<string, unknown>): string {
  const rawNodes = Array.isArray(block.nodes) ? block.nodes : [];
  if (rawNodes.length === 0) return '';

  const title = nonEmptyString(block.title) || 'Dòng thời gian chi tiết';
  const lines: string[] = [`### ${title}`];
  for (const rawNode of rawNodes) {
    const node = asRecord(rawNode);
    if (!node) continue;
    const datePart =
      nonEmptyString(node.dateLabel) || nonEmptyString(node.year);
    const nodeTitle = nonEmptyString(node.title);
    const desc =
      htmlToCleanMarkdown(node.description) ||
      htmlToCleanMarkdown(node.contentHtml) ||
      htmlToCleanMarkdown(node.detailContent);
    const location = nonEmptyString(node.locationName);
    const prefix = [datePart ? `[${datePart}]` : '', nodeTitle]
      .filter(Boolean)
      .join(' ');
    const suffix = [desc, location ? `Địa điểm: ${location}` : '']
      .filter(Boolean)
      .join(' — ');
    if (prefix || suffix) {
      lines.push(
        `${BULLET_PREFIX}${[prefix, suffix].filter(Boolean).join(': ')}`,
      );
    }
  }
  return lines.length > 1 ? lines.join('\n') : '';
}

function formatComparisonTableBlock(block: Record<string, unknown>): string {
  const rawRows = Array.isArray(block.rows) ? block.rows : [];
  if (rawRows.length === 0) return '';

  const title = nonEmptyString(block.title);
  const colA = nonEmptyString(block.colAName) || 'Đối tượng A';
  const colB = nonEmptyString(block.colBName) || 'Đối tượng B';
  const lines = [
    ...(title ? [`### ${title}`, ''] : []),
    `| Tiêu chí | ${colA} | ${colB} |`,
    '| --- | --- | --- |',
  ];

  for (const rawRow of rawRows) {
    const row = asRecord(rawRow);
    if (!row) continue;
    const criteria = nonEmptyString(row.criteria).replace(/\|/g, '/');
    const a = nonEmptyString(row.colA).replace(/\|/g, '/');
    const b = nonEmptyString(row.colB).replace(/\|/g, '/');
    if (criteria || a || b) {
      lines.push(`| ${criteria} | ${a} | ${b} |`);
    }
  }
  return lines.join('\n');
}

function formatRelatedListBlock(
  block: Record<string, unknown>,
  arrayKey: 'people' | 'events',
  defaultTitle: string,
): string {
  const items = Array.isArray(block[arrayKey]) ? block[arrayKey] : [];
  if (items.length === 0) return '';
  const title = nonEmptyString(block.title) || defaultTitle;
  const lines = [`### ${title}`];
  for (const item of items) {
    const rec = asRecord(item);
    if (!rec) continue;
    const name = nonEmptyString(rec.name) || nonEmptyString(rec.title);
    const extra =
      nonEmptyString(rec.role) ||
      (rec.year !== undefined ? String(rec.year) : '');
    if (name) {
      lines.push(`${BULLET_PREFIX}${extra ? `${name} (${extra})` : name}`);
    }
  }
  return lines.length > 1 ? lines.join('\n') : '';
}

function formatMapBlock(block: Record<string, unknown>): string {
  const location = nonEmptyString(block.locationName);
  const desc = htmlToCleanMarkdown(block.description);
  if (!location && !desc) return '';
  return `**Địa danh ${location || ''}:** ${desc}`.trim();
}

function formatResourceLinkBlock(block: Record<string, unknown>): string {
  const title = nonEmptyString(block.title);
  const url = nonEmptyString(block.url);
  const note = nonEmptyString(block.note);
  if (!title && !url) return '';
  const link = url ? `[${title || url}](${url})` : title;
  return `${BULLET_PREFIX}Tư liệu: ${note ? `${link} — ${note}` : link}`;
}

function formatSectionRowBlock(block: Record<string, unknown>): string {
  const columns = Array.isArray(block.columns) ? block.columns : [];
  const sections: string[] = [];
  for (const rawCol of columns) {
    const col = asRecord(rawCol);
    if (!col || !Array.isArray(col.blocks)) continue;
    const text = blocksToMarkdown(col.blocks);
    if (text) sections.push(text);
  }
  return sections.join(PARAGRAPH_BREAK);
}

type BlockFormatter = (block: Record<string, unknown>) => string;

const BLOCK_FORMATTERS: Record<string, BlockFormatter> = {
  TEXT: (b) => htmlToCleanMarkdown(b.content),
  paragraph: (b) => htmlToCleanMarkdown(b.content),
  HEADING: formatHeadingBlock,
  heading: formatHeadingBlock,
  QUOTE: formatQuoteBlock,
  quote: formatQuoteBlock,
  CALLOUT: formatCalloutBlock,
  CHARACTER: (b) => formatCharacterOrEventBlock(b, 'Nhân vật'),
  EVENT: (b) => formatCharacterOrEventBlock(b, 'Sự kiện'),
  TIMELINE: formatTimelineBlock,
  COMPARISON_TABLE: formatComparisonTableBlock,
  MAP: formatMapBlock,
  RESOURCE_LINK: formatResourceLinkBlock,
  RELATED_PEOPLE: (b) =>
    formatRelatedListBlock(b, 'people', 'Nhân vật liên quan'),
  RELATED_EVENTS: (b) =>
    formatRelatedListBlock(b, 'events', 'Sự kiện liên quan'),
  SECTION_ROW: formatSectionRowBlock,
  IMAGE: (b) =>
    nonEmptyString(b.caption) ? `*Hình ảnh: ${nonEmptyString(b.caption)}*` : '',
};

/** Rút toàn bộ nội dung văn bản sạch từ mảng contentBlocks (Article, Lesson, BlogPost). */
export function blocksToMarkdown(rawBlocks: unknown): string {
  if (!Array.isArray(rawBlocks)) return '';
  const sections: string[] = [];

  for (const raw of rawBlocks) {
    const block = asRecord(raw);
    if (!block) continue;
    const typeKey = nonEmptyString(block.type);
    const formatter = BLOCK_FORMATTERS[typeKey];
    const formatted = formatter
      ? formatter(block)
      : htmlToCleanMarkdown(block.content ?? block.text ?? '');
    if (formatted) {
      sections.push(formatted);
    }
  }

  return sections.join(PARAGRAPH_BREAK).trim();
}

export interface ExtractedBlogMetaBlock {
  tags: string[];
  references: Array<{ title: string; source: string; url: string }>;
}

function collectMetaTags(rawTags: unknown, target: string[]): void {
  if (!Array.isArray(rawTags)) return;
  for (const tag of rawTags) {
    const clean = nonEmptyString(tag);
    if (clean) target.push(clean);
  }
}

function collectMetaReferences(
  rawRefs: unknown,
  target: Array<{ title: string; source: string; url: string }>,
): void {
  if (!Array.isArray(rawRefs)) return;
  for (const ref of rawRefs) {
    const rec = asRecord(ref);
    if (!rec) continue;
    const title = nonEmptyString(rec.title);
    const source = nonEmptyString(rec.source);
    const url = nonEmptyString(rec.url);
    if (title || source || url) {
      target.push({ title, source, url });
    }
  }
}

/** Rút tags & references từ block `type: 'meta', kind: 'metadata'` của BlogPost. */
export function extractBlogMetaBlock(
  rawBlocks: unknown,
): ExtractedBlogMetaBlock {
  const tags: string[] = [];
  const references: Array<{ title: string; source: string; url: string }> = [];
  if (!Array.isArray(rawBlocks)) return { tags, references };

  for (const raw of rawBlocks) {
    const block = asRecord(raw);
    if (!block || block.type !== 'meta') continue;
    collectMetaTags(block.tags, tags);
    collectMetaReferences(block.references, references);
  }

  return { tags: Array.from(new Set(tags)), references };
}
