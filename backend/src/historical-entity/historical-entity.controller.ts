import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateEntityMediaDto,
  CreateEntityRelationDto,
  CreateHistoricalEntityDto,
  EntityMediaResponseDto,
  EntityRelationResponseDto,
  HistoricalEntityResponseDto,
  QueryHistoricalEntityDto,
  UpdateHistoricalEntityDto,
} from './dto/historical-entity.dto';
import { HISTORICAL_ENTITY_ROUTES } from './historical-entity.constant';
import {
  HistoricalEntityService,
  IEntityGraphData,
  IPaginatedEntities,
} from './historical-entity.service';
import { ContentWrite } from '../common/access/access.decorator';

@ApiTags(
  'Historical Entities - Thực thể Lịch sử (Nhân vật, Tổ chức, Triều đại, Hiện vật)',
)
@Controller(HISTORICAL_ENTITY_ROUTES.ROOT)
export class HistoricalEntityController {
  constructor(private readonly service: HistoricalEntityService) {}

  @Post()
  @ContentWrite({ model: 'historicalEntity' })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới thực thể lịch sử (Master Data dùng chung)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: HistoricalEntityResponseDto,
  })
  create(@Body() dto: CreateHistoricalEntityDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách thực thể lịch sử có phân trang và bộ lọc',
  })
  @ApiResponse({ status: HttpStatus.OK })
  findAll(
    @Query() query: QueryHistoricalEntityDto,
  ): Promise<IPaginatedEntities> {
    return this.service.findAll(query);
  }

  @Get(HISTORICAL_ENTITY_ROUTES.BY_ID)
  @ApiOperation({ summary: 'Lấy chi tiết một thực thể lịch sử theo ID' })
  @ApiResponse({ status: HttpStatus.OK, type: HistoricalEntityResponseDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(HISTORICAL_ENTITY_ROUTES.BY_ID)
  @ContentWrite({ model: 'historicalEntity', idParam: 'id', versioned: true })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật thực thể lịch sử' })
  @ApiResponse({ status: HttpStatus.OK, type: HistoricalEntityResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateHistoricalEntityDto) {
    return this.service.update(id, dto);
  }

  @Delete(HISTORICAL_ENTITY_ROUTES.BY_ID)
  @ContentWrite({ model: 'historicalEntity', idParam: 'id' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa thực thể lịch sử' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ==========================================
  // Quan hệ hồi quy N-N (Knowledge Graph)
  // ==========================================
  @Post(HISTORICAL_ENTITY_ROUTES.RELATIONS)
  @ContentWrite({ model: 'historicalEntity', idParam: 'id' })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo quan hệ đồ thị giữa thực thể hiện tại với thực thể khác',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: EntityRelationResponseDto,
  })
  addRelation(
    @Param('id') sourceId: string,
    @Body() dto: CreateEntityRelationDto,
  ) {
    return this.service.addRelation(sourceId, dto);
  }

  @Delete(HISTORICAL_ENTITY_ROUTES.RELATION_BY_ID)
  @ContentWrite({ model: 'historicalEntity', idParam: 'id' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa mối quan hệ giữa 2 thực thể' })
  removeRelation(@Param('relationId') relationId: string) {
    return this.service.removeRelation(relationId);
  }

  @Get(HISTORICAL_ENTITY_ROUTES.GRAPH)
  @ApiOperation({
    summary: 'Lấy dữ liệu mạng lưới quan hệ Knowledge Graph của thực thể',
  })
  @ApiResponse({ status: HttpStatus.OK })
  getEntityGraph(@Param('id') id: string): Promise<IEntityGraphData> {
    return this.service.getEntityGraph(id);
  }

  // ==========================================
  // Tư liệu đa phương tiện (Media / Document)
  // ==========================================
  @Post(HISTORICAL_ENTITY_ROUTES.MEDIA)
  @ContentWrite({ model: 'historicalEntity', idParam: 'id' })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Thêm tư liệu media/văn kiện/ảnh cho thực thể' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: EntityMediaResponseDto,
  })
  addMedia(@Param('id') entityId: string, @Body() dto: CreateEntityMediaDto) {
    return this.service.addMedia(entityId, dto);
  }

  @Delete(HISTORICAL_ENTITY_ROUTES.MEDIA_BY_ID)
  @ContentWrite({ model: 'historicalEntity', idParam: 'id' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa tư liệu media của thực thể' })
  removeMedia(@Param('mediaId') mediaId: string) {
    return this.service.removeMedia(mediaId);
  }
}
