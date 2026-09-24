import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Users - Quản lý Người dùng')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một người dùng (Admin)',
    description: 'Yêu cầu quyền quản trị. Khởi tạo tài khoản mới kèm Role và Status.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo người dùng thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email hoặc Username đã tồn tại' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả người dùng',
    description: 'Yêu cầu quyền quản trị. Trả về danh sách người dùng kèm thông tin profile.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách người dùng thành công',
    type: [UserResponseDto],
  })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy chi tiết một người dùng theo ID',
    description: 'Trả về thông tin chi tiết tài khoản và profile.',
  })
  @ApiParam({ name: 'id', description: 'UUID của người dùng', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy người dùng',
    type: UserResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng / Profile / Role',
    description: 'Cập nhật tài khoản, mật khẩu hoặc hồ sơ người dùng.',
  })
  @ApiParam({ name: 'id', description: 'UUID người dùng cần sửa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật người dùng thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa một người dùng (Admin)',
    description: 'Yêu cầu quyền quản trị. Xóa người dùng khỏi hệ thống.',
  })
  @ApiParam({ name: 'id', description: 'UUID người dùng cần xóa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa người dùng thành công',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
