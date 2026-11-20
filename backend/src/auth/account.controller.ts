import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { AccountService } from './account.service';
import { ChangeMyPasswordDto, UpdateMyProfileDto } from './dto/account.dto';

interface AuthedRequest {
  user: { userId: string };
}

/** Trang "Tài khoản": mọi thao tác chỉ tác động lên tài khoản đang đăng nhập (lấy từ token). */
@ApiTags('Account - Tài khoản của tôi')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('me')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Hồ sơ tài khoản đang đăng nhập' })
  getProfile(@Req() req: AuthedRequest) {
    return this.accountService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật họ tên, giới thiệu, ảnh đại diện' })
  updateProfile(@Req() req: AuthedRequest, @Body() dto: UpdateMyProfileDto) {
    return this.accountService.updateProfile(req.user.userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu (thu hồi mọi phiên đăng nhập)' })
  changePassword(@Req() req: AuthedRequest, @Body() dto: ChangeMyPasswordDto) {
    return this.accountService.changePassword(req.user.userId, dto);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất khỏi mọi thiết bị' })
  logoutAll(@Req() req: AuthedRequest) {
    return this.accountService.logoutAll(req.user.userId);
  }
}
