import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { HistoricalStatementService } from './historical-statement.service';
import { CreateHistoricalStatementDto } from './dto/create-statement.dto';
import { UpdateHistoricalStatementDto } from './dto/update-statement.dto';
import { QueryHistoricalStatementDto } from './dto/query-statement.dto';
import {
  QueryStatementGraphDto,
  StatementGraphResponseDto,
} from './dto/statement-graph.dto';
import { HistoricalStatementResponseDto } from './dto/statement-response.dto';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';

@ApiTags('Historical Statements - Đồ thị Tri thức Lịch sử (Knowledge Graph)')
@Controller('historical-statements')
export class HistoricalStatementController {
  constructor(
    private readonly statementService: HistoricalStatementService,
  ) {}

  @Post()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary: 'Tạo một phát biểu / quan hệ lịch sử mới',
    description:
      'Liên kết Chủ thể (Entity/Event) với Đối tượng (Entity/Event/Literal) qua Vị ngữ (Predicate). Có kiểm tra ràng buộc toàn vẹn.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo phát biểu thành công',
    type: HistoricalStatementResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ hoặc vi phạm quy tắc logic lịch sử',
  })
  async create(@Body() dto: CreateHistoricalStatementDto) {
    return this.statementService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Tìm kiếm và phân trang các phát biểu lịch sử',
    description:
      'Lọc linh hoạt theo Subject, Object, Node ID bất kỳ, Predicate, Niên đại, v.v.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách phát biểu thành công',
  })
  async findMany(@Query() query: QueryHistoricalStatementDto) {
    return this.statementService.findMany(query);
  }

  @Get('graph')
  @ApiOperation({
    summary: 'Truy vấn mạng lưới đồ thị tri thức (Knowledge Graph)',
    description:
      'Duyệt đồ thị đa bước (BFS multi-hop traversal) từ một Node trung tâm lên đến độ sâu 3, trả về danh sách Nodes và Edges.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy đồ thị thành công',
    type: StatementGraphResponseDto,
  })
  async getGraph(@Query() query: QueryStatementGraphDto) {
    return this.statementService.getGraph(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một phát biểu lịch sử',
  })
  @ApiParam({ name: 'id', description: 'ID của phát biểu' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy chi tiết thành công',
    type: HistoricalStatementResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy phát biểu',
  })
  async findOne(@Param('id') id: string) {
    return this.statementService.findOne(id);
  }

  @Patch(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary: 'Cập nhật một phát biểu lịch sử',
  })
  @ApiParam({ name: 'id', description: 'ID của phát biểu' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật phát biểu thành công',
    type: HistoricalStatementResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHistoricalStatementDto,
  ) {
    return this.statementService.update(id, dto);
  }

  @Delete(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xoá một phát biểu lịch sử',
  })
  @ApiParam({ name: 'id', description: 'ID của phát biểu' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xoá phát biểu thành công',
  })
  async remove(@Param('id') id: string) {
    return this.statementService.remove(id);
  }
}
