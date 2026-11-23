import {
  buildCoreCandidates,
  cleanWikipediaExtract,
  formatWikipediaMarkdown,
} from './rag-wiki.util';

describe('RAG Wikipedia / Wikidata Utilities', () => {
  it('xây dựng đúng danh sách chủ đề VN và Thế giới theo scope', () => {
    const vnOnly = buildCoreCandidates('vn');
    const worldOnly = buildCoreCandidates('world');
    const both = buildCoreCandidates('all');

    expect(vnOnly.every((item) => item.scope === 'VN')).toBe(true);
    expect(worldOnly.every((item) => item.scope === 'WORLD')).toBe(true);
    expect(both.length).toBe(vnOnly.length + worldOnly.length);
  });

  it('làm sạch heading Wikipedia == ... == sang chuẩn Markdown', () => {
    const raw =
      'Đoạn mở đầu.\n\n== Diễn biến ==\nNội dung chính.\n\n=== Kết quả ===\nThắng lợi.';
    const cleaned = cleanWikipediaExtract(raw);
    expect(cleaned).toContain('## Diễn biến');
    expect(cleaned).toContain('### Kết quả');
  });

  it('xuất đúng Markdown và WikiManifestEntry giữ nguyên link gốc Wikipedia', () => {
    const sampleHost = ['vi', 'wikipedia', 'org'].join('.');
    const wikiUrl = [
      'https',
      `${sampleHost}/wiki/C%C3%A1ch_m%E1%BA%A1ng_Ph%C3%A1p`,
    ].join('://');
    const formatted = formatWikipediaMarkdown({
      title: 'Cách mạng Pháp',
      scope: 'WORLD',
      sourceUrl: wikiUrl,
      extract:
        '== Bối cảnh ==\nCách mạng Pháp bùng nổ năm 1789 làm rung chuyển châu Âu.',
      wikipediaHost: sampleHost,
    });

    expect(formatted.relativePath).toBe('articles/world--cach-mang-phap.md');
    expect(formatted.manifestEntry.kind).toBe('WIKIPEDIA');
    expect(formatted.manifestEntry.href).toBe(wikiUrl);
    expect(formatted.manifestEntry.gcsDefaultPath).toBe(
      'wikipedia/articles/world--cach-mang-phap.md',
    );
    expect(formatted.markdown).toContain('## Bối cảnh');
  });
});
