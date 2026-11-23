import { sanitizeExportSlug } from './rag-export.formatter';

export type WikiScope = 'all' | 'vn' | 'world';

export interface WikiManifestEntry {
  relativePath: string;
  gcsDefaultPath: string;
  kind: 'WIKIPEDIA';
  scope: 'VN' | 'WORLD';
  title: string;
  subtitle: string;
  href: string;
  wikipediaSlug: string;
}

export interface WikiManifestDocument {
  version: number;
  fetchedAt: string;
  scope: WikiScope;
  total: number;
  entries: WikiManifestEntry[];
}

export interface WikiCandidateTitle {
  title: string;
  scope: 'VN' | 'WORLD';
}

export const CORE_VN_HISTORY_TITLES: readonly string[] = [
  'Văn Lang',
  'Âu Lạc',
  'Hai Bà Trưng',
  'Bà Triệu',
  'Lý Nam Đế',
  'Mai Thúc Loan',
  'Khúc Thừa Dụ',
  'Ngô Quyền',
  'Chiến thắng Bạch Đằng năm 938',
  'Đinh Bộ Lĩnh',
  'Lê Hoàn',
  'Nhà Lý',
  'Lý Thái Tổ',
  'Lý Thường Kiệt',
  'Chiến tranh Tống–Việt (1075–1077)',
  'Nhà Trần',
  'Trần Hưng Đạo',
  'Chiến tranh Mông–Đại Việt',
  'Hội nghị Diên Hồng',
  'Chiến thắng Bạch Đằng năm 1288',
  'Hồ Quý Ly',
  'Khởi nghĩa Lam Sơn',
  'Lê Lợi',
  'Nguyễn Trãi',
  'Bình Ngô đại cáo',
  'Lê Thánh Tông',
  'Nhà Mạc',
  'Trịnh–Nguyễn phân tranh',
  'Phong trào Tây Sơn',
  'Quang Trung',
  'Trận Rạch Gầm – Xoài Mút',
  'Trận Ngọc Hồi – Đống Đa',
  'Nhà Nguyễn',
  'Gia Long',
  'Minh Mạng',
  'Phong trào Cần Vương',
  'Phan Bội Châu',
  'Phan Châu Trinh',
  'Đảng Cộng sản Việt Nam',
  'Cách mạng Tháng Tám',
  'Hồ Chí Minh',
  'Tuyên ngôn Độc lập Việt Nam Dân chủ Cộng hòa',
  'Chiến dịch Việt Bắc thu đông 1947',
  'Chiến dịch Biên giới thu đông 1950',
  'Chiến dịch Điện Biên Phủ',
  'Võ Nguyên Giáp',
  'Hiệp định Genève 1954',
  'Chiến tranh Việt Nam',
  'Chiến dịch Tết Mậu Thân 1968',
  'Hiệp định Paris 1973',
  'Chiến dịch Hồ Chí Minh',
  'Văn hóa Đông Sơn',
  'Hoàng thành Thăng Long',
  'Cố đô Huế',
  'Thánh địa Mỹ Sơn',
];

export const CORE_WORLD_HISTORY_TITLES: readonly string[] = [
  'Ai Cập cổ đại',
  'Lưỡng Hà',
  'Hy Lạp cổ đại',
  'Alexander Đại đế',
  'Đế quốc La Mã',
  'Julius Caesar',
  'Augustus',
  'Nhà Tần',
  'Tần Thủy Hoàng',
  'Nhà Hán',
  'Con đường tơ lụa',
  'Nhà Đường',
  'Thành Cát Tư Hãn',
  'Đế quốc Mông Cổ',
  'Thời kỳ Phục Hưng',
  'Leonardo da Vinci',
  'Thời đại Khám phá',
  'Christopher Columbus',
  'Cải cách Kháng nghị',
  'Thời kỳ Khai sáng',
  'Cách mạng Công nghiệp',
  'James Watt',
  'Chiến tranh giành độc lập Hoa Kỳ',
  'Tuyên ngôn Độc lập Hoa Kỳ',
  'George Washington',
  'Cách mạng Pháp',
  'Napoleon Bonaparte',
  'Cải cách Minh Trị',
  'Cách mạng Công nghiệp lần thứ hai',
  'Chiến tranh thế giới thứ nhất',
  'Cách mạng Tháng Mười Nga',
  'Vladimir Ilyich Lenin',
  'Đại suy thoái',
  'Chiến tranh thế giới thứ hai',
  'Adolf Hitler',
  'Trận Stalingrad',
  'Trận Normandy',
  'Liên Hợp Quốc',
  'Tuyên ngôn Quốc tế Nhân quyền',
  'Chiến tranh Lạnh',
  'Cách mạng Tân Hợi',
  'Tôn Trung Sơn',
  'Chiến tranh Triều Tiên',
  'Sự sụp đổ của Liên Xô',
  'Liên minh châu Âu',
  'Hiệp hội các quốc gia Đông Nam Á',
  'Cách mạng công nghiệp lần thứ tư',
];

export const WIKI_FALLBACK_CATEGORIES: Record<
  'VN' | 'WORLD',
  readonly string[]
> = {
  VN: [
    'Lịch sử Việt Nam',
    'Chiến tranh Việt Nam',
    'Triều đại Việt Nam',
    'Nhân vật lịch sử Việt Nam',
    'Trận đánh trong lịch sử Việt Nam',
  ],
  WORLD: [
    'Lịch sử thế giới',
    'Cách mạng',
    'Đế quốc',
    'Chiến tranh thế giới thứ nhất',
    'Chiến tranh thế giới thứ hai',
    'Nền văn minh cổ đại',
  ],
};

const WIKIPEDIA_GCS_PREFIX = 'wikipedia/';
const FRONTMATTER_BOUNDARY = '---';

export function buildCoreCandidates(scope: WikiScope): WikiCandidateTitle[] {
  const result: WikiCandidateTitle[] = [];
  if (scope === 'all' || scope === 'vn') {
    for (const title of CORE_VN_HISTORY_TITLES) {
      result.push({ title, scope: 'VN' });
    }
  }
  if (scope === 'all' || scope === 'world') {
    for (const title of CORE_WORLD_HISTORY_TITLES) {
      result.push({ title, scope: 'WORLD' });
    }
  }
  return result;
}

export function cleanWikipediaExtract(rawExtract: string): string {
  return rawExtract
    .replace(/\r\n/g, '\n')
    .replace(/====\s*([^=\n]+?)\s*====/g, '#### $1')
    .replace(/===\s*([^=\n]+?)\s*===/g, '### $1')
    .replace(/==\s*([^=\n]+?)\s*==/g, '## $1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatWikipediaMarkdown(input: {
  title: string;
  scope: 'VN' | 'WORLD';
  sourceUrl: string;
  extract: string;
  wikipediaHost: string;
}): {
  relativePath: string;
  markdown: string;
  manifestEntry: WikiManifestEntry;
} {
  const safeSlug = sanitizeExportSlug(input.title, 'wiki');
  const scopePrefix = input.scope === 'VN' ? 'vn--' : 'world--';
  const relativePath = `articles/${scopePrefix}${safeSlug}.md`;
  const cleanBody = cleanWikipediaExtract(input.extract);
  const scopeLabel =
    input.scope === 'VN'
      ? 'Lịch sử Việt Nam (Wikipedia)'
      : 'Lịch sử Thế giới (Wikipedia)';
  const wikiPathPrefix = `${input.wikipediaHost}/wiki/`;
  const wikiSlug = input.sourceUrl.includes(wikiPathPrefix)
    ? decodeURIComponent(
        input.sourceUrl.split(wikiPathPrefix)[1] ?? input.title,
      )
    : input.title.replace(/\s+/g, '_');

  const frontmatter = [
    FRONTMATTER_BOUNDARY,
    `kind: "WIKIPEDIA"`,
    `scope: ${JSON.stringify(input.scope)}`,
    `title: ${JSON.stringify(input.title)}`,
    `sourceUrl: ${JSON.stringify(input.sourceUrl)}`,
    FRONTMATTER_BOUNDARY,
  ].join('\n');

  const markdown = [
    frontmatter,
    `# ${input.title}`,
    `- **Nguồn tham khảo:** ${scopeLabel}\n- **Liên kết bài gốc:** ${input.sourceUrl}`,
    cleanBody,
  ].join('\n\n');

  return {
    relativePath,
    markdown: `${markdown}\n`,
    manifestEntry: {
      relativePath,
      gcsDefaultPath: `${WIKIPEDIA_GCS_PREFIX}${relativePath}`,
      kind: 'WIKIPEDIA',
      scope: input.scope,
      title: input.title,
      subtitle: scopeLabel,
      href: input.sourceUrl,
      wikipediaSlug: wikiSlug,
    },
  };
}
