import { Test, TestingModule } from '@nestjs/testing';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';
import { PublicArticleCatalogService } from './public-article-catalog.service';

describe('PublicContentController', () => {
  let controller: PublicContentController;

  const service = {
    getCategories: jest.fn(),
    getCategoryBySlug: jest.fn(),
    getArticles: jest.fn(),
    getArticleBySlug: jest.fn(),
    getTimelines: jest.fn(),
    getTimelineBySlug: jest.fn(),
    getTags: jest.fn(),
    getLibraryLessons: jest.fn(),
    getTopics: jest.fn(),
    getTopicBySlug: jest.fn(),
    submitQuizAttempt: jest.fn(),
  };

  const catalogService = {
    queryCatalog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicContentController],
      providers: [
        { provide: PublicContentService, useValue: service },
        { provide: PublicArticleCatalogService, useValue: catalogService },
      ],
    }).compile();

    controller = module.get<PublicContentController>(PublicContentController);
    jest.clearAllMocks();
  });

  it('delegates active public content and catalog endpoints cleanly', async () => {
    await controller.getCategories();
    await controller.getArticleCatalog({ page: 1, limit: 24 });
    await controller.getArticle('bach-dang-938');
    await controller.getTimelines();
    await controller.getTimeline('nha-tran');
    await controller.getTopics();
    await controller.getTags('tran', 10);
    await controller.getLessons();

    expect(service.getCategories).toHaveBeenCalledTimes(1);
    expect(catalogService.queryCatalog).toHaveBeenCalledWith({
      page: 1,
      limit: 24,
    });
    expect(service.getArticleBySlug).toHaveBeenCalledWith('bach-dang-938');
    expect(service.getTimelines).toHaveBeenCalledTimes(1);
    expect(service.getTimelineBySlug).toHaveBeenCalledWith('nha-tran');
    expect(service.getTopics).toHaveBeenCalledTimes(1);
    expect(service.getTags).toHaveBeenCalledWith({ q: 'tran', limit: 10 });
    expect(service.getLibraryLessons).toHaveBeenCalledTimes(1);
  });
});
