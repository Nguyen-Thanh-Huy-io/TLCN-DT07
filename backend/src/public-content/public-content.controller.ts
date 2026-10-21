import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LandingContentFacade } from './landing-content.facade';
import {
  LandingResponseDto,
  PublicEventSummaryDto,
  PublicFigureDetailDto,
  PublicFigureDto,
  PublicLocationSummaryDto,
  PublicPeriodDetailDto,
  PublicPeriodDto,
  PublicTopicDetailDto,
  PublicTopicDto,
  QueryPublicTopicsDto,
} from './dto/public-content.dto';
import { PUBLIC_CONTENT_ROUTES } from './public-content.constant';

@ApiTags('Public Content - Nội dung Công khai (Landing Page & Detail Reader)')
@Controller(PUBLIC_CONTENT_ROUTES.ROOT)
export class PublicContentController {
  constructor(private readonly facade: LandingContentFacade) {}

  @Get(PUBLIC_CONTENT_ROUTES.LANDING)
  @ApiOperation({
    summary: 'Lấy toàn bộ dữ liệu hiển thị cho Landing Page',
    description:
      'Endpoint công khai không cần đăng nhập, chỉ trả về nội dung đã xuất bản (PUBLISHED).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LandingResponseDto,
  })
  getLanding(): Promise<LandingResponseDto> {
    return this.facade.getLanding();
  }

  @Get(PUBLIC_CONTENT_ROUTES.PERIODS)
  @ApiOperation({
    summary: 'Lấy danh sách giai đoạn lịch sử công khai',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PublicPeriodDto],
  })
  getPeriods(): Promise<PublicPeriodDto[]> {
    return this.facade.getPeriods();
  }

  @Get(PUBLIC_CONTENT_ROUTES.PERIOD_DETAIL)
  @ApiOperation({
    summary: 'Lấy chi tiết giai đoạn lịch sử theo slug kèm chuyên đề, sự kiện & nhân vật',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PublicPeriodDetailDto,
  })
  getPeriodBySlug(@Param('slug') slug: string): Promise<PublicPeriodDetailDto> {
    return this.facade.getPeriodBySlug(slug);
  }

  @Get(PUBLIC_CONTENT_ROUTES.FIGURES)
  @ApiOperation({
    summary: 'Lấy danh sách nhân vật lịch sử tiêu biểu công khai',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PublicFigureDto],
  })
  getFigures(): Promise<PublicFigureDto[]> {
    return this.facade.getFigures();
  }

  @Get(PUBLIC_CONTENT_ROUTES.FIGURE_DETAIL)
  @ApiOperation({
    summary: 'Lấy chi tiết nhân vật / thực thể lịch sử theo slug kèm sự kiện & bài học liên quan',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PublicFigureDetailDto,
  })
  getFigureBySlug(@Param('slug') slug: string): Promise<PublicFigureDetailDto> {
    return this.facade.getFigureBySlug(slug);
  }

  @Get(PUBLIC_CONTENT_ROUTES.TOPICS)
  @ApiOperation({
    summary: 'Lấy danh sách chủ đề công khai theo từng section landing',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PublicTopicDto],
  })
  getTopics(@Query() query: QueryPublicTopicsDto): Promise<PublicTopicDto[]> {
    return this.facade.getSection(query.section);
  }

  @Get(PUBLIC_CONTENT_ROUTES.TOPIC_DETAIL)
  @ApiOperation({
    summary: 'Lấy chi tiết chương sử / chủ đề kiến thức theo slug kèm bài học & sự kiện',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PublicTopicDetailDto,
  })
  getTopicBySlug(@Param('slug') slug: string): Promise<PublicTopicDetailDto> {
    return this.facade.getTopicBySlug(slug);
  }

  @Get(PUBLIC_CONTENT_ROUTES.LOCATIONS)
  @ApiOperation({
    summary: 'Lấy danh sách di tích / địa danh lịch sử công khai',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PublicLocationSummaryDto],
  })
  getLocations(): Promise<PublicLocationSummaryDto[]> {
    return this.facade.getLocations();
  }

  @Get(PUBLIC_CONTENT_ROUTES.EVENTS)
  @ApiOperation({
    summary: 'Lấy danh sách sự kiện lịch sử công khai theo mốc thời gian',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PublicEventSummaryDto],
  })
  getEvents(): Promise<PublicEventSummaryDto[]> {
    return this.facade.getEvents();
  }
}

