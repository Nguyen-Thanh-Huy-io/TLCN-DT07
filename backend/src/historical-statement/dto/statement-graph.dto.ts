import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { STATEMENT_CONSTANTS } from '../historical-statement.constant';

export class QueryStatementGraphDto {
  @ApiProperty({
    description: 'ID của Node gốc để bắt đầu duyệt đồ thị (Entity ID hoặc Event ID)',
    example: 'clx...node-id',
  })
  @IsString()
  @IsNotEmpty()
  nodeId: string;

  @ApiPropertyOptional({
    description: 'Độ sâu duyệt đồ thị (1 đến 3)',
    default: STATEMENT_CONSTANTS.DEFAULT_GRAPH_DEPTH,
    minimum: 1,
    maximum: STATEMENT_CONSTANTS.MAX_GRAPH_DEPTH,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(STATEMENT_CONSTANTS.MAX_GRAPH_DEPTH)
  depth?: number = STATEMENT_CONSTANTS.DEFAULT_GRAPH_DEPTH;

  @ApiPropertyOptional({
    description: 'Có bao gồm cả các thuộc tính Literal (dân số, quân số...) trong đồ thị không',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeLiterals?: boolean = false;
}

export class GraphNodeDto {
  @ApiProperty({ description: 'ID định danh nút' })
  id: string;

  @ApiProperty({ description: 'Tên hiển thị' })
  label: string;

  @ApiProperty({ description: 'Loại nút: ENTITY, EVENT hoặc LITERAL' })
  kind: 'ENTITY' | 'EVENT' | 'LITERAL';

  @ApiPropertyOptional({ description: 'Mã phân loại (VD: PERSON, DYNASTY, BATTLE...)' })
  typeCode?: string;

  @ApiPropertyOptional({ description: 'Nhãn phân loại (VD: Nhân vật, Triều đại...)' })
  typeLabel?: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện hoặc icon' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Năm bắt đầu / sinh' })
  startYear?: number | null;

  @ApiPropertyOptional({ description: 'Năm kết thúc / mất' })
  endYear?: number | null;

  @ApiPropertyOptional({ description: 'Chuỗi niên đại gốc' })
  dateText?: string | null;

  @ApiPropertyOptional({ description: 'Khoảng cách bước nhảy từ nút gốc' })
  distance?: number;
}

export class GraphEdgeDto {
  @ApiProperty({ description: 'ID của quan hệ statement' })
  id: string;

  @ApiProperty({ description: 'ID nút nguồn (Subject)' })
  source: string;

  @ApiProperty({ description: 'ID nút đích (Object)' })
  target: string;

  @ApiProperty({ description: 'ID loại quan hệ' })
  predicateId: string;

  @ApiProperty({ description: 'Mã mối quan hệ (VD: PARENT_OF, COMMANDED...)' })
  predicateCode: string;

  @ApiProperty({ description: 'Tên tiếng Việt hiển thị của quan hệ' })
  predicateLabel: string;

  @ApiPropertyOptional({ description: 'Năm bắt đầu hiệu lực' })
  validFromYear?: number | null;

  @ApiPropertyOptional({ description: 'Năm kết thúc hiệu lực' })
  validToYear?: number | null;

  @ApiProperty({ description: 'Quan hệ chính yếu' })
  isPrimary: boolean;

  @ApiPropertyOptional({ description: 'Dữ liệu phụ' })
  qualifiers?: Record<string, any> | null;
}

export class StatementGraphResponseDto {
  @ApiProperty({ description: 'ID nút gốc' })
  rootNodeId: string;

  @ApiProperty({ description: 'Độ sâu duyệt' })
  depth: number;

  @ApiProperty({ description: 'Danh sách các đỉnh (Nodes)', type: [GraphNodeDto] })
  nodes: GraphNodeDto[];

  @ApiProperty({ description: 'Danh sách các cạnh (Edges)', type: [GraphEdgeDto] })
  edges: GraphEdgeDto[];

  @ApiProperty({ description: 'Tổng số đỉnh' })
  totalNodes: number;

  @ApiProperty({ description: 'Tổng số cạnh' })
  totalEdges: number;
}
