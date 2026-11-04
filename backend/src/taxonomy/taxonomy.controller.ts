import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';
import {
  CreateTaxonomyTermDto,
  UpdateTaxonomyTermDto,
} from './dto/taxonomy.dto';
import { TAXONOMY_ROUTES } from './taxonomy.constant';
import { TaxonomyService } from './taxonomy.service';

const parseGroups = (groups?: string) =>
  groups
    ?.split(',')
    .map((g) => g.trim())
    .filter(Boolean);

@ApiTags('Taxonomy (Danh mục dùng chung)')
@Controller()
export class TaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get(TAXONOMY_ROUTES.PUBLIC)
  @ApiOperation({
    summary:
      'Danh mục dùng chung (nhãn, biểu tượng, thứ tự) cho giao diện công khai',
  })
  @ApiQuery({
    name: 'groups',
    required: false,
    example: 'SITE_TYPE,PRESERVATION',
  })
  getPublic(@Query('groups') groups?: string) {
    return this.taxonomy.listGroups(parseGroups(groups));
  }

  /** CMS: xem cả giá trị đang ẩn. */
  @Get('taxonomies')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary: 'CMS: toàn bộ nhóm danh mục, kể cả giá trị đang ẩn',
  })
  getAll(@Query('groups') groups?: string) {
    return this.taxonomy.listGroups(parseGroups(groups), true);
  }

  /** Sửa danh mục ảnh hưởng toàn hệ thống — chỉ người duyệt / superadmin. */
  @Post(TAXONOMY_ROUTES.CMS_TERMS)
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({ summary: 'CMS: thêm giá trị danh mục' })
  create(@Body() dto: CreateTaxonomyTermDto) {
    return this.taxonomy.createTerm(dto);
  }

  @Patch(TAXONOMY_ROUTES.CMS_TERM)
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({
    summary: 'CMS: sửa giá trị danh mục (nhãn, alias, thứ tự, ẩn/hiện...)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateTaxonomyTermDto) {
    return this.taxonomy.updateTerm(id, dto);
  }

  @Delete(TAXONOMY_ROUTES.CMS_TERM)
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({ summary: 'CMS: xóa giá trị chưa được sử dụng' })
  remove(@Param('id') id: string) {
    return this.taxonomy.deleteTerm(id);
  }
}
