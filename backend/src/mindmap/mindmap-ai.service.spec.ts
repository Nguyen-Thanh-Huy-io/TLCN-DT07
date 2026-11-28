import { BadRequestException } from '@nestjs/common';
import config from '../common/config/app.config';
import { MindmapAiService } from './mindmap-ai.service';
import {
  MindmapAiEngine,
  MindmapBranchColor,
  MindmapStructure,
} from './mindmap.constant';

describe('MindmapAiService', () => {
  let service: MindmapAiService;
  let mockPrisma: {
    note: { findMany: jest.Mock };
    article: { findMany: jest.Mock };
  };
  const originalKey = config.gemini_api_key;
  const originalSa = config.google_cloud_service_account_json;
  const originalCreds = config.google_application_credentials;

  beforeEach(() => {
    config.gemini_api_key = '';
    config.google_application_credentials = '';
    config.google_cloud_service_account_json = '';
    mockPrisma = {
      note: { findMany: jest.fn().mockResolvedValue([]) },
      article: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new MindmapAiService(mockPrisma as never);
  });

  afterAll(() => {
    config.gemini_api_key = originalKey;
    config.google_cloud_service_account_json = originalSa;
    config.google_application_credentials = originalCreds;
  });

  it('ném BadRequestException khi không có prompt lẫn nguồn dữ liệu nào', async () => {
    await expect(
      service.generatePreview('user-1', {
        includeNotes: false,
        articleIds: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('dựng sơ đồ phân cấp 3 tầng bằng Heuristic từ prompt ("Bạn muốn xây dựng cái gì?") ngay cả khi DB chưa có dữ liệu', async () => {
    const res = await service.generatePreview('user-1', {
      prompt:
        'Khởi nghĩa Lam Sơn (1418–1427): Bối cảnh nhà Minh đô hộ; Lê Lợi dựng cờ tại Lam Sơn; Chiến thắng Chi Lăng - Xương Giang.',
      structure: MindmapStructure.LOGIC_CHART,
      includeNotes: false,
    });

    expect(res.engine).toBe(MindmapAiEngine.HEURISTIC);
    expect(res.title).toContain('Khởi nghĩa Lam Sơn');
    expect(res.graph.structure).toBe(MindmapStructure.LOGIC_CHART);
    expect(res.graph.nodes[0].id).toBe('n-root');
    expect(res.graph.nodes.length).toBeGreaterThanOrEqual(9);
    expect(res.graph.edges.length).toBeGreaterThanOrEqual(8);
  });

  it('kết hợp bài viết đã lưu (kèm articleRef) và ghi chú cá nhân vào sơ đồ', async () => {
    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-1',
        slug: 'nha-tran',
        title: 'Vương triều Nhà Trần',
        summary: 'Ba lần đánh thắng quân Nguyên - Mông.',
        dateText: '1225 – 1400',
        contentBlocks: [{ type: 'HEADING', text: 'Hội nghị Diên Hồng' }],
      },
    ]);
    mockPrisma.note.findMany.mockResolvedValue([
      {
        id: 'note-1',
        title: 'Hịch tướng sĩ',
        content: 'Trần Quốc Tuấn soạn để khích lệ tướng sĩ.',
        highlightText: 'Hịch tướng sĩ',
      },
    ]);

    const res = await service.generatePreview('user-1', {
      includeNotes: true,
      articleIds: ['11111111-1111-4111-8111-111111111111'],
    });

    expect(res.engine).toBe(MindmapAiEngine.HEURISTIC);
    expect(res.articleCount).toBe(1);
    expect(res.noteCount).toBe(1);
    expect(res.graph.nodes.some((n) => n.articleRef?.slug === 'nha-tran')).toBe(
      true,
    );
  });

  it('gọi Gemini Flash khi có gemini_api_key và gắn articleRef nếu khớp bài viết', async () => {
    config.gemini_api_key = 'test-gemini-key';
    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-dbp',
        slug: 'chien-dich-dien-bien-phu',
        title: 'Chiến dịch Điện Biên Phủ',
        summary: 'Lừng lẫy năm châu, chấn động địa cầu.',
        dateText: '1954',
        contentBlocks: [],
      },
    ]);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'Chiến dịch Điện Biên Phủ 1954',
                    periodLabel: '13/3 – 7/5/1954',
                    nodes: [
                      {
                        id: 'n-root',
                        x: 420,
                        y: 240,
                        title: 'Chiến dịch Điện Biên Phủ',
                        color: MindmapBranchColor.CRIMSON,
                      },
                      {
                        id: 'n-1',
                        x: 700,
                        y: 180,
                        title: '3 đợt tiến công',
                        note: 'Đánh chắc, tiến chắc',
                        color: MindmapBranchColor.GOLD,
                      },
                    ],
                    edges: [{ id: 'e-1', fromId: 'n-root', toId: 'n-1' }],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const res = await service.generatePreview('user-1', {
      prompt: 'Chiến dịch Điện Biên Phủ',
    });

    expect(res.engine).toBe(MindmapAiEngine.GEMINI_FLASH);
    expect(res.title).toBe('Chiến dịch Điện Biên Phủ 1954');
    expect(res.graph.nodes).toHaveLength(2);
    expect(res.graph.nodes[0].articleRef?.slug).toBe(
      'chien-dich-dien-bien-phu',
    );
    fetchSpy.mockRestore();
  });

  it('tự động gán imageUrl và trích xuất nguồn dẫn chứng (articleRef & externalUrl) cho các node', async () => {
    config.gemini_api_key = 'test-gemini-key';
    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-lam-son',
        slug: 'khoi-nghia-lam-son',
        title: 'Khởi nghĩa Lam Sơn',
        summary: 'Cuộc khởi nghĩa chống quân Minh thắng lợi vẻ vang.',
        dateText: '1418 – 1427',
        coverImageUrl: 'https://hisgo.vn/images/lam-son.jpg',
        contentBlocks: [],
      },
    ]);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'Khởi nghĩa Lam Sơn (1418–1427)',
                    nodes: [
                      {
                        id: 'n-root',
                        x: 420,
                        y: 240,
                        title: 'Khởi nghĩa Lam Sơn',
                        color: MindmapBranchColor.CRIMSON,
                      },
                      {
                        id: 'n-1',
                        x: 700,
                        y: 180,
                        title: 'Chiến thắng Chi Lăng - Xương Giang',
                        color: MindmapBranchColor.GOLD,
                      },
                    ],
                    edges: [{ id: 'e-1', fromId: 'n-root', toId: 'n-1' }],
                  }),
                },
              ],
            },
            groundingMetadata: {
              groundingChunks: [
                {
                  web: {
                    uri: 'https://vi.wikipedia.org/wiki/Khởi_nghĩa_Lam_Sơn',
                    title: 'Khởi nghĩa Lam Sơn – Wikipedia',
                  },
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const res = await service.generatePreview('user-1', {
      prompt: 'Hãy phân tích cuộc Khởi nghĩa Lam Sơn',
      useGoogleSearch: true,
    });

    expect(res.engine).toBe(MindmapAiEngine.GEMINI_FLASH);
    // Node gốc tự động có imageUrl từ coverImageUrl của bài viết khớp
    expect(res.graph.nodes[0].imageUrl).toBe('https://hisgo.vn/images/lam-son.jpg');
    // Node gốc có articleRef để mở Reader Drawer
    expect(res.graph.nodes[0].articleRef?.slug).toBe('khoi-nghia-lam-son');
    // Trích xuất nguồn dẫn chứng web URI vào externalUrl
    expect(res.graph.nodes[0].externalUrl).toBe('https://vi.wikipedia.org/wiki/Khởi_nghĩa_Lam_Sơn');
    fetchSpy.mockRestore();
  });

  it('bảo toàn các node người học đã tự soạn trên Canvas và nối tiếp nhánh mới khi truyền existingGraph', async () => {
    const existingGraph = {
      nodes: [
        {
          id: 'n-root',
          x: 420,
          y: 240,
          title: 'Nhà Trần (1225–1400)',
          color: MindmapBranchColor.CRIMSON,
        },
        {
          id: 'n-user-1',
          x: 680,
          y: 160,
          title: 'Kháng chiến lần 1 (1258)',
          color: MindmapBranchColor.GOLD,
        },
      ],
      edges: [{ id: 'e-u1', fromId: 'n-root', toId: 'n-user-1' }],
    };

    const res = await service.generatePreview('user-1', {
      prompt: 'Bổ sung diễn biến trận Đông Bộ Đầu và kết quả thắng lợi',
      existingGraph,
      selectedNodeId: 'n-user-1',
    });

    // Giữ nguyên 100% node gốc và nhánh người dùng đã tự soạn
    expect(res.title).toBe('Nhà Trần (1225–1400)');
    expect(
      res.graph.nodes.some(
        (n) => n.id === 'n-user-1' && n.title === 'Kháng chiến lần 1 (1258)',
      ),
    ).toBe(true);
    // Đã sinh thêm các nhánh con mới nối trực tiếp vào node đang chọn 'n-user-1'
    expect(res.graph.edges.some((e) => e.fromId === 'n-user-1')).toBe(true);
    expect(res.graph.nodes.length).toBeGreaterThan(2);
  });

  it('tự động nhận diện cấu trúc tối ưu (autoDetectStructure) chuẩn xác theo ngữ nghĩa chủ đề', async () => {
    // 1. Phân tích nguyên nhân -> FISHBONE
    const fishboneRes = await service.generatePreview('user-1', {
      prompt: 'Phân tích nguyên nhân thắng lợi của cuộc kháng chiến chống quân Minh',
      autoDetectStructure: true,
    });
    expect(fishboneRes.graph.structure).toBe(MindmapStructure.FISHBONE);
    expect(fishboneRes.structure).toBe(MindmapStructure.FISHBONE);

    // 2. Bộ máy nhà nước / tổ chức -> ORG_CHART
    const orgRes = await service.generatePreview('user-1', {
      prompt: 'Sơ đồ tổ chức bộ máy nhà nước thời vua Lê Thánh Tông',
      autoDetectStructure: true,
    });
    expect(orgRes.graph.structure).toBe(MindmapStructure.ORG_CHART);
    expect(orgRes.structure).toBe(MindmapStructure.ORG_CHART);

    // 3. Tiến trình / giai đoạn / mốc năm -> TIMELINE
    const timelineRes = await service.generatePreview('user-1', {
      prompt: 'Các giai đoạn tiến trình lịch sử kháng chiến chống Mỹ (1954 - 1975)',
      autoDetectStructure: true,
    });
    expect(timelineRes.graph.structure).toBe(MindmapStructure.TIMELINE);
    expect(timelineRes.structure).toBe(MindmapStructure.TIMELINE);
  });

  it('hỗ trợ cờ useGoogleSearch trong DTO preview', async () => {
    const res = await service.generatePreview('user-1', {
      prompt: 'Khởi nghĩa Hai Bà Trưng năm 40',
      useGoogleSearch: true,
    });
    expect(res.title).toBeDefined();
    expect(res.graph.nodes.length).toBeGreaterThan(0);
  });

  it('tự động fallback về heuristic an toàn khi Gemini AI gặp lỗi hoặc API trả dữ liệu lỗi', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Gemini API 500 Network Error'));

    const res = await service.generatePreview('user-1', {
      prompt: 'Chiến dịch Điện Biên Phủ 1954',
    });

    expect(res).toBeDefined();
    expect(res.engine).toBe(MindmapAiEngine.HEURISTIC);
    expect(res.graph.nodes.length).toBeGreaterThan(0);
    expect(res.title).toContain('Chiến dịch Điện Biên Phủ 1954');
    fetchSpy.mockRestore();
  });

  it('nối tiếp chính xác nhánh con khi gọi Gemini AI có selectedNodeId', async () => {
    config.gemini_api_key = 'test-gemini-key';
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'Kháng chiến chống Tống',
                    nodes: [
                      {
                        id: 'n-root',
                        title: 'Phòng tuyến sông Như Nguyệt',
                        color: MindmapBranchColor.GOLD,
                      },
                      {
                        id: 'n-sub-1',
                        title: 'Bài thơ Nam quốc sơn hà',
                        color: MindmapBranchColor.GOLD,
                      },
                      {
                        id: 'n-sub-2',
                        title: 'Trận quyết chiến ven sông',
                        color: MindmapBranchColor.GOLD,
                      },
                    ],
                    edges: [
                      { id: 'e-1', fromId: 'n-root', toId: 'n-sub-1' },
                      { id: 'e-2', fromId: 'n-root', toId: 'n-sub-2' },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const existingGraph = {
      nodes: [
        {
          id: 'n-root-main',
          x: 420,
          y: 240,
          title: 'Triều Lý (1009 - 1225)',
          color: MindmapBranchColor.CRIMSON,
        },
        {
          id: 'n-branch-target',
          x: 650,
          y: 200,
          title: 'Phòng tuyến sông Như Nguyệt',
          color: MindmapBranchColor.INDIGO,
        },
      ],
      edges: [{ id: 'e-main', fromId: 'n-root-main', toId: 'n-branch-target' }],
    };

    const res = await service.generatePreview('user-1', {
      prompt: 'Mở rộng chi tiết diễn biến và ý nghĩa',
      existingGraph,
      selectedNodeId: 'n-branch-target',
    });

    expect(res.engine).toBe(MindmapAiEngine.GEMINI_FLASH);
    // Nhánh con mới phải có edge xuất phát từ 'n-branch-target' chứ không phải 'n-root-main'
    const edgesFromBranch = res.graph.edges.filter(
      (e) => e.fromId === 'n-branch-target',
    );
    expect(edgesFromBranch.length).toBeGreaterThanOrEqual(2);
    // Node cha gốc vẫn giữ nguyên
    expect(res.graph.nodes.some((n) => n.id === 'n-root-main')).toBe(true);
    fetchSpy.mockRestore();
  });

  it('an toàn tuyệt đối không văng lỗi khi existingGraph có node rỗng hoặc thiếu title', async () => {
    const brokenGraph = {
      nodes: [
        { id: 'n-root', x: 420, y: 240, title: '' },
        { id: 'n-empty', x: 600, y: 200, title: undefined as unknown as string },
      ],
      edges: [],
    };

    const res = await service.generatePreview('user-1', {
      prompt: 'Triều Tây Sơn hào hùng',
      existingGraph: brokenGraph,
    });

    expect(res).toBeDefined();
    expect(res.graph.nodes.length).toBeGreaterThan(0);
  });
});
