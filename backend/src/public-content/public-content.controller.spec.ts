import { Test, TestingModule } from '@nestjs/testing';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';

describe('PublicContentController', () => {
  let controller: PublicContentController;

  const service = {
    getPeriods: jest.fn(),
    getPeriodBySlug: jest.fn(),
    getEvents: jest.fn(),
    getEventBySlug: jest.fn(),
    getFigureDirectory: jest.fn(),
    getFigureBySlug: jest.fn(),
    getLocations: jest.fn(),
    getLocationBySlug: jest.fn(),
    getTaxonomies: jest.fn(),
    getCategories: jest.fn(),
    getCategoryBySlug: jest.fn(),
    getArticles: jest.fn(),
    getArticleBySlug: jest.fn(),
    getTimelines: jest.fn(),
    getTimelineBySlug: jest.fn(),
    getTags: jest.fn(),
    getLibraryLessons: jest.fn(),
    getTopicBySlug: jest.fn(),
    submitQuizAttempt: jest.fn(),
    getQuizStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicContentController],
      providers: [{ provide: PublicContentService, useValue: service }],
    }).compile();

    controller = module.get<PublicContentController>(PublicContentController);
    jest.clearAllMocks();
  });

  it('exposes the legacy public catalog endpoints expected by frontend', async () => {
    await controller.getPeriods();
    await controller.getPeriodBySlug('nam-qua');
    await controller.getEvents();
    await controller.getEventBySlug('bien-gioi');
    await controller.getFigureDirectory();
    await controller.getFigureBySlug('ho-chi-minh');
    await controller.getLocations();
    await controller.getLocationBySlug('dien-bien-phu');
    await controller.getTaxonomies(['REGION', 'FIGURE_ROLE']);

    expect(service.getPeriods).toHaveBeenCalledTimes(1);
    expect(service.getPeriodBySlug).toHaveBeenCalledWith('nam-qua');
    expect(service.getEvents).toHaveBeenCalledTimes(1);
    expect(service.getEventBySlug).toHaveBeenCalledWith('bien-gioi');
    expect(service.getFigureDirectory).toHaveBeenCalledTimes(1);
    expect(service.getFigureBySlug).toHaveBeenCalledWith('ho-chi-minh');
    expect(service.getLocations).toHaveBeenCalledTimes(1);
    expect(service.getLocationBySlug).toHaveBeenCalledWith('dien-bien-phu');
    expect(service.getTaxonomies).toHaveBeenCalledWith(['REGION', 'FIGURE_ROLE']);
  });
});
