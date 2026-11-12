export interface BlogMetadataReference {
  title: string;
  source: string;
  url: string;
}

export interface ExtractedBlogMetadata {
  tags: string[];
  references: BlogMetadataReference[];
}

export const BLOG_ACCENT_PALETTE = [
  'from-[#7b3f2b] via-[#b27342] to-[#d9c09b]',
  'from-[#3a4d43] via-[#6a7d5f] to-[#d2c5a3]',
  'from-[#513b31] via-[#9b724f] to-[#e0c8a8]',
  'from-[#2e3a3d] via-[#58716a] to-[#d7d0bf]',
  'from-[#5a3929] via-[#ad7659] to-[#f0dabc]',
  'from-[#3d4a55] via-[#72828a] to-[#eee1bf]',
] as const;

const BLOCK_TYPE_META = 'meta';
const BLOCK_KIND_METADATA = 'metadata';

function isExplicitMetadataBlock(candidate: Record<string, unknown>): boolean {
  return (
    (candidate.type === BLOCK_TYPE_META &&
      candidate.kind === BLOCK_KIND_METADATA) ||
    candidate.type === BLOCK_KIND_METADATA ||
    candidate.kind === BLOCK_KIND_METADATA
  );
}

function isMetadataBlockCandidate(
  candidate: Record<string, unknown>,
): boolean {
  return (
    isExplicitMetadataBlock(candidate) ||
    Array.isArray(candidate.tags) ||
    Array.isArray(candidate.references) ||
    Boolean(candidate.metadata && typeof candidate.metadata === 'object')
  );
}

function extractNestedMetadataObject(
  candidate: Record<string, unknown>,
): Record<string, unknown> {
  if (candidate.metadata && typeof candidate.metadata === 'object') {
    return candidate.metadata as Record<string, unknown>;
  }
  return candidate;
}

function normalizeTagItem(tag: unknown): string {
  if (typeof tag === 'string') return tag;
  if (tag && typeof tag === 'object') {
    const record = tag as Record<string, unknown>;
    if (typeof record.name === 'string') return record.name;
    if (typeof record.value === 'string') return record.value;
  }
  return '';
}

function normalizeReferenceItem(
  reference: Record<string, unknown>,
): BlogMetadataReference {
  const title =
    typeof reference.title === 'string'
      ? reference.title
      : typeof reference.name === 'string'
        ? reference.name
        : '';
  const source = typeof reference.source === 'string' ? reference.source : '';
  const url =
    typeof reference.url === 'string'
      ? reference.url
      : typeof reference.link === 'string'
        ? reference.link
        : '';
  return { title, source, url };
}

export function extractMetadataFromBlocks(
  contentBlocks: unknown,
): ExtractedBlogMetadata {
  if (!Array.isArray(contentBlocks)) {
    return { tags: [], references: [] };
  }

  const metadataCandidate = contentBlocks.find(
    (block): block is Record<string, unknown> =>
      Boolean(block && typeof block === 'object') &&
      isMetadataBlockCandidate(block as Record<string, unknown>),
  );

  const payload = metadataCandidate
    ? extractNestedMetadataObject(metadataCandidate)
    : {};

  const fallbackPayload = contentBlocks.reduce<Record<string, unknown>>(
    (acc, block) => {
      if (!block || typeof block !== 'object') return acc;
      const candidate = block as Record<string, unknown>;
      if (isExplicitMetadataBlock(candidate)) {
        return { ...acc, ...extractNestedMetadataObject(candidate) };
      }
      return acc;
    },
    {},
  );

  const finalPayload = { ...fallbackPayload, ...payload };
  const rawTags = Array.isArray(finalPayload.tags) ? finalPayload.tags : [];
  const rawReferences = Array.isArray(finalPayload.references)
    ? finalPayload.references
    : [];

  return {
    tags: rawTags
      .map(normalizeTagItem)
      .filter((tag) => tag.trim().length > 0)
      .map((tag) => tag.replace(/^#/, '')),
    references: rawReferences
      .filter(
        (reference): reference is Record<string, unknown> =>
          Boolean(reference && typeof reference === 'object'),
      )
      .map(normalizeReferenceItem),
  };
}
